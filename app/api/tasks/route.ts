import { NextResponse } from 'next/server';
import {prisma} from '../../../db'
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const { rawInput } = await req.json();

    const task = await prisma.task.create({
      data: { rawInput },
    });
    await redis.lpush('task_queue', task.id);
    return NextResponse.json({ success: true, taskId: task.id }, { status: 200 });
  } catch (error) {
    console.error('Gateway Error:', error);
    return NextResponse.json({ error: 'Failed to process task' }, { status: 500 });
  }
}