import "dotenv/config";
import { prisma } from "../db";
import { Redis } from '@upstash/redis';
import { GoogleGenAI, Type } from '@google/genai';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

console.log('Hardened Worker initialized. Polling task_queue...');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callAiWithRetry(fn: () => Promise<any>, retries = 3, delay = 2000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === retries - 1) throw error;
      console.warn(`[AI Warning] Request failed (Status: ${error.status || 'Unknown'}). Retrying ${i + 1}/${retries} in ${delay}ms...`);
      await sleep(delay);
      delay *= 2;
    }
  }
}

async function sweepAndRecalibrateDeadlines() {
  try {
    const now = new Date();

    const overdueSubTasks = await prisma.subTask.findMany({
      where: {
        status: 'PENDING',
        deadline: { lt: now }
      },
      select: { taskId: true, id: true }
    });

    if (overdueSubTasks.length === 0) return;

    console.log(`\n[Triage Sweep] Found ${overdueSubTasks.length} overdue milestones!`);

    const subTaskIds = overdueSubTasks.map(st => st.id);

    await prisma.subTask.updateMany({
      where: { id: { in: subTaskIds } },
      data: { status: 'MISSED' }
    });

    const uniqueTaskIds = Array.from(new Set(overdueSubTasks.map(st => st.taskId)));

    for (const taskId of uniqueTaskIds) {
      const parentTask = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (parentTask && parentTask.status !== 'PROCESSING') {
        await prisma.task.update({
          where: { id: taskId },
          data: { status: 'PENDING' }
        });

        await pusher.trigger('task-updates', 'task-completed', { taskId });

        await redis.lpush('task_queue', taskId);

        console.log(`[Triage Sweep] Re-queued Task ID: ${taskId} to compress the schedule.`);
      }
    }
  } catch (error) {
    console.error('[Triage Sweep] Error during deadline sweep:', error);
  }
}

async function processQueue() {
  while (true) {
    let currentTaskId: string | null = null;

    try {
      const taskId = await redis.rpop<string>('task_queue');

      if (taskId) {
        currentTaskId = taskId;

        console.log(`\n[Worker] Locked Task ID: ${taskId}`);

        const task = await prisma.task.update({
          where: { id: taskId },
          data: { status: 'PROCESSING' },
        });

        await pusher.trigger('task-updates', 'task-processing', { taskId });

        console.log('[Worker] Routing to Evaluator Agent...');

        const evaluatorResponse = await callAiWithRetry(() =>
          ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: `Current System Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} (IST)
           You must calculate all deadlines based on this time and return them as strict ISO 8601 UTC strings.
                       Analyze this user's task dump and extract urgency and deadlines. 
                       Task: "${task.rawInput}"`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  urgencyScore: {
                    type: Type.INTEGER,
                    description: 'Scale of 1-10',
                  },
                  extractedDeadline: {
                    type: Type.STRING,
                    description: 'ISO 8601 Date String or null if none',
                  },
                  context: {
                    type: Type.STRING,
                    description: 'Brief summary of the situation',
                  },
                },
                required: ['urgencyScore', 'context'],
              },
            },
          })
        );

        const evaluation = JSON.parse(evaluatorResponse.text!);

        console.log(`[Worker] Evaluator Score: ${evaluation.urgencyScore}/10`);

        await prisma.task.update({
          where: { id: taskId },
          data: {
            urgency: evaluation.urgencyScore,
            deadline: evaluation.extractedDeadline
              ? new Date(evaluation.extractedDeadline)
              : null,
          },
        });

        console.log('[Worker] Routing to Planner Agent...');

        const existingSubTasks = await prisma.subTask.findMany({
          where: { taskId: task.id },
          orderBy: { order: 'asc' }
        });

        const missedTasksContext = existingSubTasks
          .filter(st => st.status === 'MISSED')
          .map(st => `- MISSED: ${st.title}`)
          .join('\n') || 'None. Fresh start.';

        const plannerResponse = await callAiWithRetry(() =>
          ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: `Current System Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} (IST)
           You must calculate all deadlines based on this time and return them as strict ISO 8601 UTC strings.
                       You are an expert productivity planner helping a user running out of time.
                       Original Input: "${task.rawInput}"
                       Context: ${evaluation.context}
                       Deadline: ${evaluation.extractedDeadline || 'Assume ASAP'}
                       
                       CRITICAL HISTORY: The user has ALREADY MISSED these milestones:
                       ${missedTasksContext}
                       
                       Generate a revised, compressed, actionable sequence of sub-tasks for the remaining time. Do not include the missed tasks, just plan the remaining steps.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: 'Short, actionable title',
                    },
                    description: {
                      type: Type.STRING,
                    },
                    deadline: {
                      type: Type.STRING,
                      description: 'Calculated ISO 8601 Date String for this specific step',
                    },
                  },
                  required: ['title', 'deadline'],
                },
              },
            },
          })
        );

        const subTasksData = JSON.parse(plannerResponse.text!);

        await prisma.subTask.deleteMany({
          where: {
            taskId: task.id,
            status: 'PENDING'
          }
        });

        const historicalCount = await prisma.subTask.count({
          where: { taskId: task.id }
        });

        await prisma.subTask.createMany({
          data: subTasksData.map((st: any, index: number) => ({
            taskId: task.id,
            title: st.title,
            description: st.description,
            deadline: new Date(st.deadline),
            order: historicalCount + index + 1,
            status: 'PENDING',
          })),
        });

        await prisma.task.update({
          where: { id: taskId },
          data: { status: 'COMPLETED' },
        });

        await pusher.trigger('task-updates', 'task-completed', { taskId });

        console.log(`[Worker] Task ID: ${taskId} successfully processed.`);
      } else {
        await sweepAndRecalibrateDeadlines();
        await sleep(3000);
      }
    } catch (error) {
      console.error('[Worker] Fatal error processing job:', error);

      if (currentTaskId) {
        try {
          await prisma.task.update({
            where: { id: currentTaskId },
            data: { status: 'FAILED' },
          });
        } catch (dbErr) {
          console.error('[Worker] Failed to update task status to FAILED:', dbErr);
        }
      }

      await sleep(5000);
    }
  }
}

processQueue();