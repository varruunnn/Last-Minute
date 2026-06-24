## Last-Minute Life Saver

An AI-powered productivity system that converts chaotic, last-minute panic into an actionable recovery plan.

Instead of acting as another task manager, Last-Minute Life Saver behaves like an intelligent triage system. Users can dump their situation in natural language, and the platform analyzes urgency, extracts deadlines, generates milestones, and continuously recalibrates plans when deadlines are missed.

## Features
## AI Task Triage

Users submit a free-form "brain dump" such as:

"I have a placement interview tomorrow, haven't revised DBMS or OS, and still need to solve SQL questions."

The system automatically:

Extracts urgency level
Detects deadlines
Understands context
Creates a structured execution plan

## AI-Generated Action Plans
A dedicated planning agent generates:
Ordered milestones
Actionable subtasks
Individual deadlines
Compressed schedules for urgent situations

Example:

1. Revise DBMS Fundamentals
2. Solve 10 SQL Questions
3. Revise Operating Systems
4. Complete Mock Interview

## Asynchronous Processing Pipeline
Task creation never waits for AI processing.
Workflow:
User Request
     ↓
API Gateway
     ↓
PostgreSQL
     ↓
Redis Queue
     ↓
Background Worker
     ↓
Gemini AI
     ↓
Database Update

This architecture keeps API latency low while supporting expensive AI workloads.

## Adaptive Replanning

Most task managers stop working after a deadline is missed.
Last-Minute Life Saver continuously monitors overdue milestones and automatically:
Detects missed tasks
Marks them as MISSED
Re-queues the parent task
Generates a compressed recovery plan

This creates a feedback loop that adapts to user behavior instead of assuming perfect execution.

## Real-Time Updates
Using WebSockets via Pusher:
Task Processing
Task Completion
Plan Updates
Status Changes
The dashboard updates instantly without page refreshes.

## 🏗 High-Level System Architecture

```mermaid
graph TD

    classDef frontend fill:#18181b,stroke:#6366f1,stroke-width:2px,color:#fff;
    classDef api fill:#27272a,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef db fill:#0f172a,stroke:#0ea5e9,stroke-width:2px,color:#fff;
    classDef worker fill:#3f3f46,stroke:#f59e0b,stroke-width:2px,color:#fff;
    classDef ai fill:#450a0a,stroke:#ef4444,stroke-width:2px,color:#fff;
    classDef socket fill:#14532d,stroke:#22c55e,stroke-width:2px,color:#fff;

    subgraph Client["Frontend Layer (Next.js)"]
        UI["React Dashboard"]
    end

    subgraph Serverless["API Gateway"]
        API["POST /api/tasks"]
    end

    subgraph DataLayer["Persistence Layer"]
        DB[("PostgreSQL<br/>Prisma")]
        Redis[/"Upstash Redis<br/>Queue"/]
    end

    subgraph AsyncWorker["Background Worker"]
        Worker["Job Processor"]
        Sweep["Procrastination Engine"]
    end

    subgraph AILayer["Google AI Studio"]
        Eval["Evaluator Agent"]
        Plan["Planner Agent"]
    end

    Pusher(("Pusher WebSockets"))

    class UI frontend
    class API api
    class DB,Redis db
    class Worker,Sweep worker
    class Eval,Plan ai
    class Pusher socket

    UI -->|1 Submit Brain Dump| API
    API -->|2 Save Task| DB
    API -->|3 Push Job ID| Redis

    Redis -->|4 Pop Job| Worker

    Worker -->|5 Processing Event| Pusher
    Pusher -.->|Realtime Update| UI

    Worker <-->|6 Assess Urgency| Eval
    Worker <-->|7 Generate Plan| Plan

    Worker -->|8 Save Subtasks| DB
    Worker -->|9 Completed Event| Pusher

    Sweep -.->|10 Check Overdue| DB
    Sweep -.->|11 Requeue Missed| Redis
