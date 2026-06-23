```mermaid
graph TD
    %% Styling
    classDef frontend fill:#3178c6,stroke:#fff,stroke-width:2px,color:#fff;
    classDef backend fill:#000,stroke:#3178c6,stroke-width:2px,color:#fff;
    classDef db fill:#336791,stroke:#fff,stroke-width:2px,color:#fff;
    classDef queue fill:#dc382d,stroke:#fff,stroke-width:2px,color:#fff;
    classDef ai fill:#ea4335,stroke:#fff,stroke-width:2px,color:#fff;

    %% Nodes
    User([User / Student])
    
    subgraph "Google Cloud Starter Tier (Full-Stack)"
        UI["Next.js Frontend\n(Dashboard & Forms)"]:::frontend
        API["Next.js API Gateway\n(REST / Server Actions)"]:::backend
        PrismaORM["Prisma Client"]:::backend
        Postgres[(PostgreSQL\nCloud SQL)]:::db
    end

    subgraph "Distributed Queue Architecture"
        Redis[("Redis\n(Job Queue & State)")]:::queue
        Worker["Bun Worker Node\n(Job Processing)"]:::backend
    end

    subgraph "Google AI Studio"
        EvalAgent["Evaluator Agent\n(Categorization & Urgency)"]:::ai
        PlanAgent["Worker Agent\n(Task Breakdown & JSON Output)"]:::ai
    end

    %% Flow: User Input
    User -->|Submits Brain-Dump| UI
    UI -->|POST /api/tasks| API
    
    %% Flow: DB & Queue persistence
    API -->|1. Save Raw Task Status: Pending| PrismaORM
    API -->|2. Enqueue Job| Redis
    PrismaORM <--> Postgres
    
    %% Flow: Worker Processing
    Redis -->|3. Consume Job| Worker
    Worker -->|4. Prompt: Assess Urgency| EvalAgent
    EvalAgent -->|5. Returns Priority & Context| Worker
    Worker -->|6. Prompt: Generate Schedule| PlanAgent
    PlanAgent -->|7. Returns Strict JSON Schedule| Worker
    
    %% Flow: Finalize
    Worker -->|8. Update Task & Insert Sub-Tasks| PrismaORM
    Worker -->|9. Acknowledge Job| Redis

    %% Real-time update
    Postgres -.->|Polling/Webhooks| UI
