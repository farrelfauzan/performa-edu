# Quiz Service — Database Approach Comparison

## Context

A new `quiz-service` microservice (gRPC on port **50054**) for the performa-edu platform. This document compares two approaches: **PostgreSQL** (consistent with existing services) vs **MongoDB** (document-oriented).

---

## Data Model Overview

A quiz feature needs to store:

| Entity | Description |
|--------|-------------|
| **Quiz** | Belongs to a Content/Section. Has title, description, time limit, passing score, max attempts |
| **Question** | Belongs to a Quiz. Has question text, type (multiple-choice, true/false, short-answer, multi-select), points, explanation, sort order |
| **Option** | Belongs to a Question. Has option text, is_correct flag, sort order |
| **QuizAttempt** | A student's attempt at a quiz. Has score, started_at, submitted_at, status |
| **AttemptAnswer** | A student's answer to a question within an attempt. Has selected options, text answer, is_correct, points earned |

---

## Approach A — PostgreSQL (Prisma)

### Schema Design

```prisma
model Quiz {
  id            String    @id @default(uuid())
  contentId     String    @map("content_id")
  sectionId     String?   @map("section_id")
  title         String    @db.VarChar(255)
  description   String?   @db.Text
  timeLimitSecs Int?      @map("time_limit_secs")
  passingScore  Int       @default(70) @map("passing_score")   // percentage
  maxAttempts   Int       @default(3)  @map("max_attempts")
  shuffleQuestions Boolean @default(false) @map("shuffle_questions")
  isPublished   Boolean   @default(false) @map("is_published")
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt     DateTime? @map("deleted_at") @db.Timestamptz

  questions     Question[]
  attempts      QuizAttempt[]

  @@map("quizzes")
}

model Question {
  id           String   @id @default(uuid())
  quizId       String   @map("quiz_id")
  type         QuestionType
  text         String   @db.Text
  explanation  String?  @db.Text
  points       Int      @default(1)
  sortOrder    Int      @default(0) @map("sort_order")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz

  quiz         Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  options      QuestionOption[]
  answers      AttemptAnswer[]

  @@map("questions")
}

model QuestionOption {
  id         String  @id @default(uuid())
  questionId String  @map("question_id")
  text       String  @db.Text
  isCorrect  Boolean @default(false) @map("is_correct")
  sortOrder  Int     @default(0) @map("sort_order")

  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@map("question_options")
}

model QuizAttempt {
  id          String        @id @default(uuid())
  quizId      String        @map("quiz_id")
  userId      String        @map("user_id")
  score       Float?
  totalPoints Int?          @map("total_points")
  status      AttemptStatus @default(IN_PROGRESS)
  startedAt   DateTime      @default(now()) @map("started_at") @db.Timestamptz
  submittedAt DateTime?     @map("submitted_at") @db.Timestamptz

  quiz    Quiz            @relation(fields: [quizId], references: [id], onDelete: Cascade)
  answers AttemptAnswer[]

  @@map("quiz_attempts")
}

model AttemptAnswer {
  id              String  @id @default(uuid())
  attemptId       String  @map("attempt_id")
  questionId      String  @map("question_id")
  selectedOptions String[] @map("selected_options")  // array of option IDs
  textAnswer      String? @map("text_answer") @db.Text
  isCorrect       Boolean @default(false) @map("is_correct")
  pointsEarned    Float   @default(0) @map("points_earned")

  attempt  QuizAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question Question    @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([attemptId, questionId])
  @@map("attempt_answers")
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  SHORT_ANSWER
  MULTI_SELECT
}

enum AttemptStatus {
  IN_PROGRESS
  SUBMITTED
  GRADED
  TIMED_OUT
}
```

### Architecture

```
quiz-service (port 50054, gRPC)
├── quiz.module.ts
├── quiz.controller.ts         ← gRPC handlers
├── quiz.service.ts            ← business logic
├── repositories/
│   ├── quiz.repository.ts     ← quiz + question CRUD
│   └── attempt.repository.ts  ← attempt + grading
├── errors/
│   └── quiz.errors.ts
└── interfaces/
    └── quiz.interfaces.ts
```

- Uses the **same shared Prisma client** from `libs/src/prisma`
- New models added to the **existing** `schema.prisma`
- Migrations via `prisma migrate dev`
- Shares the same PostgreSQL 16 instance

### Pros

| Advantage | Detail |
|-----------|--------|
| **Zero new infrastructure** | Same Postgres + Prisma used by auth/content/teacher services |
| **Referential integrity** | Foreign keys enforce quiz→content, attempt→user relationships |
| **Transactional grading** | Submit attempt + grade all answers in a single transaction |
| **Consistent tooling** | Same Prisma migrations, soft-delete patterns, query builder |
| **Joins** | Efficient queries: get quiz with questions+options in one query via Prisma includes |
| **Reporting** | SQL aggregations for analytics (avg score, pass rate, question difficulty) |
| **Schema enforcement** | Prisma validates data shape at compile time |
| **Team familiarity** | No new tech to learn — same patterns as all existing services |

### Cons

| Disadvantage | Detail |
|--------------|--------|
| **Rigid schema** | Adding a new question type (e.g., drag-and-drop, matching) requires a migration |
| **Question metadata** | Complex question configs (image-based, code snippets with test cases) need JSON columns or extra tables |
| **Schema coupling** | Quiz models in the same `schema.prisma` — grows the shared schema |
| **Nested writes** | Creating a quiz with 20 questions × 4 options = many INSERT statements (Prisma batches them, but still) |

---

## Approach B — MongoDB (Mongoose)

### Schema Design

```typescript
// Quiz document — embeds questions + options
{
  _id: ObjectId,
  contentId: "uuid-ref",
  sectionId: "uuid-ref" | null,
  title: "Intro to Calculus Quiz",
  description: "Test your knowledge...",
  settings: {
    timeLimitSecs: 600,
    passingScore: 70,
    maxAttempts: 3,
    shuffleQuestions: true,
    shuffleOptions: false,
  },
  isPublished: false,
  questions: [
    {
      _id: ObjectId,
      type: "MULTIPLE_CHOICE",
      text: "What is the derivative of x²?",
      explanation: "Using the power rule...",
      points: 2,
      sortOrder: 0,
      options: [
        { _id: ObjectId, text: "2x", isCorrect: true, sortOrder: 0 },
        { _id: ObjectId, text: "x²", isCorrect: false, sortOrder: 1 },
        { _id: ObjectId, text: "2",  isCorrect: false, sortOrder: 2 },
        { _id: ObjectId, text: "x",  isCorrect: false, sortOrder: 3 },
      ],
      // Extensible metadata for future question types
      metadata: {
        imageUrl: null,
        codeSnippet: null,
        matchingPairs: null,
      }
    }
  ],
  createdAt: ISODate,
  updatedAt: ISODate,
  deletedAt: null,
}

// QuizAttempt — separate collection
{
  _id: ObjectId,
  quizId: ObjectId,
  userId: "uuid-ref",
  // Snapshot of questions at attempt time (prevents score changes if quiz is edited)
  questionSnapshot: [ /* copy of questions at submission */ ],
  answers: [
    {
      questionId: ObjectId,
      selectedOptionIds: [ObjectId],
      textAnswer: null,
      isCorrect: true,
      pointsEarned: 2,
    }
  ],
  score: 85.5,
  totalPoints: 20,
  status: "GRADED",
  startedAt: ISODate,
  submittedAt: ISODate,
}
```

### Architecture

```
quiz-service (port 50054, gRPC)
├── quiz.module.ts
├── quiz.controller.ts         ← gRPC handlers
├── quiz.service.ts            ← business logic
├── repositories/
│   ├── quiz.repository.ts     ← quiz CRUD (MongoDB)
│   └── attempt.repository.ts  ← attempt + grading (MongoDB)
├── schemas/
│   ├── quiz.schema.ts         ← Mongoose schema
│   └── attempt.schema.ts      ← Mongoose schema
├── errors/
│   └── quiz.errors.ts
└── interfaces/
    └── quiz.interfaces.ts
```

- Uses **@nestjs/mongoose** with a dedicated MongoDB instance
- Quiz + questions + options stored as a **single document** (embedded)
- Attempts in a separate collection (indexed by quizId + userId)
- New `mongodb` service in `docker-compose.yml`

### Pros

| Advantage | Detail |
|-----------|--------|
| **Flexible schema** | Add new question types (matching, code, drag-drop) without migrations — just add fields |
| **Single-document read** | Fetch entire quiz (questions + options) in one read — no JOINs |
| **Question snapshots** | Embed a frozen copy of questions in each attempt — accurate historical grading |
| **Rich metadata** | Each question type can have different fields without JSON columns or extra tables |
| **Natural nesting** | Quiz → Questions → Options maps directly to a document tree |
| **Write performance** | Create an entire quiz with all questions in a single document insert |
| **Schema isolation** | Quiz data is fully decoupled from the Postgres schema |

### Cons

| Disadvantage | Detail |
|--------------|--------|
| **New infrastructure** | Need a MongoDB instance (container, connection, backups) |
| **Cross-DB references** | `contentId` / `userId` are string references — no foreign keys, no cascading deletes |
| **New ORM** | Team must learn Mongoose (or use MongoDB driver directly) — different from Prisma patterns |
| **No transactions (simple)** | Multi-document transactions exist but are heavier than Postgres |
| **Reporting** | Aggregation pipelines are powerful but more complex than SQL for analytics |
| **Consistency** | Eventual consistency by default — must configure read/write concern for strict consistency |
| **Operational overhead** | Separate backup strategy, monitoring, connection management |
| **16MB doc limit** | A quiz with hundreds of questions + large media embeds could approach limits (unlikely in practice) |

---

## Side-by-Side Comparison

| Factor | PostgreSQL (Prisma) | MongoDB (Mongoose) |
|--------|--------------------|--------------------|
| **New infra needed** | None | MongoDB container + config |
| **Learning curve** | None (same stack) | Mongoose schemas, aggregation pipelines |
| **Schema flexibility** | Rigid (migrations needed) | Flexible (schemaless) |
| **Referential integrity** | FK constraints ✅ | Manual enforcement ❌ |
| **Read quiz + questions** | Prisma include (1-2 SQL queries) | Single document read |
| **Write quiz + questions** | Multiple INSERTs (batched) | Single document insert |
| **Question snapshots** | Extra table or JSON column | Natural embed in attempt doc |
| **Grading transaction** | Native Prisma transaction | Multi-doc transaction (heavier) |
| **Analytics/reporting** | SQL aggregations (simple) | Aggregation pipeline (complex) |
| **Cross-service refs** | Shared DB, same FK space | String refs, no enforcement |
| **Soft-delete pattern** | Reuse existing PrismaService helpers | Implement separately |
| **Docker compose** | No changes | Add `mongo` service + volume |
| **Production deploy** | No changes | Add managed MongoDB (Atlas or GCP) |
| **Backup strategy** | Existing Postgres backup | Separate MongoDB backup |

---

## Recommendation

### Go with **PostgreSQL** if:
- You want to ship fast with zero infrastructure changes
- Quiz structures are well-defined and won't vary wildly between question types
- Reporting and analytics (pass rates, averages, question difficulty) are important
- You value referential integrity and transactional consistency
- The team prefers staying in the Prisma ecosystem

### Go with **MongoDB** if:
- You anticipate highly varied question types in the future (code execution, matching, drag-drop, media-heavy)
- You want quiz snapshots embedded in attempts for immutable grading history
- Schema migrations for new question types feel like too much friction
- You're comfortable adding and operating a new database

### Hybrid option:
Use **PostgreSQL** for quiz metadata, attempts, and scores (relational data that benefits from FK/transactions), and store the **question definitions as a JSONB column** in Postgres. This gives you:
- Flexible question schemas (like MongoDB)
- Referential integrity for attempts and scores (like Postgres)
- No new infrastructure
- Native Postgres JSON querying for question data

```prisma
model Quiz {
  id          String   @id @default(uuid())
  contentId   String   @map("content_id")
  title       String   @db.VarChar(255)
  questions   Json     @db.JsonB   // flexible question array
  settings    Json     @db.JsonB   // time limit, passing score, etc.
  isPublished Boolean  @default(false)
  // ... timestamps
}
```

---

## gRPC Service Definition (shared by both approaches)

```protobuf
service QuizService {
  // Quiz CRUD
  rpc CreateQuiz(CreateQuizRequest) returns (CreateQuizResponse);
  rpc GetQuizById(GetQuizByIdRequest) returns (GetQuizByIdResponse);
  rpc UpdateQuiz(UpdateQuizRequest) returns (UpdateQuizResponse);
  rpc DeleteQuiz(DeleteQuizRequest) returns (DeleteQuizResponse);
  rpc GetQuizzesByContent(GetQuizzesByContentRequest) returns (GetQuizzesByContentResponse);

  // Question management
  rpc AddQuestion(AddQuestionRequest) returns (AddQuestionResponse);
  rpc UpdateQuestion(UpdateQuestionRequest) returns (UpdateQuestionResponse);
  rpc DeleteQuestion(DeleteQuestionRequest) returns (DeleteQuestionResponse);
  rpc ReorderQuestions(ReorderQuestionsRequest) returns (ReorderQuestionsResponse);

  // Quiz attempts
  rpc StartAttempt(StartAttemptRequest) returns (StartAttemptResponse);
  rpc SubmitAnswer(SubmitAnswerRequest) returns (SubmitAnswerResponse);
  rpc SubmitAttempt(SubmitAttemptRequest) returns (SubmitAttemptResponse);
  rpc GetAttemptResult(GetAttemptResultRequest) returns (GetAttemptResultResponse);
  rpc GetAttemptHistory(GetAttemptHistoryRequest) returns (GetAttemptHistoryResponse);

  // Analytics
  rpc GetQuizAnalytics(GetQuizAnalyticsRequest) returns (GetQuizAnalyticsResponse);
}
```

---

## Next Step

Choose an approach, and I'll scaffold the full `quiz-service` app with:
- NestJS module, controller, service, repository
- Proto definitions + generated types
- Database schema (Prisma models or Mongoose schemas)
- Docker compose updates
- API gateway integration
