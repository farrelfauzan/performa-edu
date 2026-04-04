# Revamp V2 — Student Service, Role Rearchitecture & Assignment System

> **Branch**: `revamp-v2`
> **Date**: 2026-03-22

---

## 1. Overview

The platform is being rearchitected with a clear separation between **teachers** and **students**:

- **Teacher** — creates content, creates quizzes, assigns them to students
- **Student** (new) — consumes assigned content, takes assigned quizzes, tracks progress
- **No self-enrollment** — only teachers assign content/quizzes to students
- **Admin / Super Admin** — system management, user oversight

This requires:
1. A new **student-service** (gRPC, port 50054)
2. Renaming Teacher → Teacher conceptually (model renamed to `Teacher`)
3. An **Assignment** model — the link between teacher, student, and content/quiz
4. Changes to auth-service for STUDENT role + registration
5. Future: quiz-service builds on this foundation

---

## 2. Role Architecture (Before → After)

### Before (v1)

| Role | Model | Purpose |
|------|-------|---------|
| SUPER_ADMIN | Admin | Full system access |
| ADMIN | Admin | Manage users, content, teachers |
| TEACHER | Teacher | Create & publish content |

### After (v2)

| Role | Model | Purpose | Frontend |
|------|-------|---------|----------|
| SUPER_ADMIN | Admin | Full system access | performa-studio |
| ADMIN | Admin | Manage users, content, teachers, students | performa-studio |
| TEACHER (Teacher) | Teacher | Create content, create quizzes, assign to students | performa-studio |
| **STUDENT** (new) | **Student** (new) | View assigned content, take assigned quizzes | **performa-app** |

> **Note**: We keep the `Teacher` model name in Prisma/DB to avoid a massive rename migration. The API and UI refer to them as "Teacher". The `TEACHER` role name in the DB also stays — it's just semantically "teacher" in the UI layer.

---

## 3. Data Model Changes

### 3.1 New Models

```prisma
model Student {
  id                String       @id @default(cuid())
  userId            String       @unique @map("user_id")
  uniqueId          String       @unique @map("unique_id")    // STU_XXXXX
  fullName          String       @map("full_name")
  phoneNumber       String?      @map("phone_number") @db.VarChar(15)
  dateOfBirth       DateTime?    @map("date_of_birth") @db.Date
  profilePictureUrl String?      @map("profile_picture_url") @db.VarChar(500)
  bio               String?      @db.Text
  active            ActiveStatus @default(ACTIVE)
  createdAt         DateTime     @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime     @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt         DateTime?    @map("deleted_at") @db.Timestamptz

  assignments       Assignment[]

  @@map("students")
}

model Assignment {
  id          String           @id @default(cuid())
  teacherId   String           @map("teacher_id")    // Teacher.id (the teacher)
  studentId   String           @map("student_id")    // Student.id
  contentId   String           @map("content_id")    // Content.id
  status      AssignmentStatus @default(ASSIGNED)
  progress    Float            @default(0)            // 0-100 percentage
  dueDate     DateTime?        @map("due_date") @db.Timestamptz
  assignedAt  DateTime         @default(now()) @map("assigned_at") @db.Timestamptz
  startedAt   DateTime?        @map("started_at") @db.Timestamptz
  completedAt DateTime?        @map("completed_at") @db.Timestamptz
  createdAt   DateTime         @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime         @updatedAt @map("updated_at") @db.Timestamptz

  @@unique([studentId, contentId])  // one assignment per student per content
  @@index([teacherId])
  @@index([contentId])
  @@map("assignments")
}

enum AssignmentStatus {
  ASSIGNED      // teacher assigned, student hasn't started
  IN_PROGRESS   // student started consuming content
  COMPLETED     // student finished all sections/quizzes
  OVERDUE       // past due date, not completed
}

enum ProgressAction {
  COMPLETE_SECTION   // student finished watching/reading a section
  ANSWER_QUESTION    // student answered a quiz question
}

model ProgressLog {
  id           String         @id @default(cuid())
  assignmentId String         @map("assignment_id")
  sectionId    String?        @map("section_id")     // ContentSection.id (string ref)
  questionId   String?        @map("question_id")    // Quiz question ID (future, string ref)
  action       ProgressAction
  createdAt    DateTime       @default(now()) @map("created_at") @db.Timestamptz

  @@unique([assignmentId, sectionId, action])           // can't complete same section twice
  @@unique([assignmentId, questionId, action])          // can't answer same question twice
  @@index([assignmentId])
  @@map("progress_logs")
}
```

**How server-calculated progress works:**

```
Content has 3 sections + section 3 has a quiz with 5 questions = 8 total items

Student completes section 1 → ProgressLog created → progress = 1/8 = 12.5%
Student completes section 2 → ProgressLog created → progress = 2/8 = 25.0%
Student answers Q1          → ProgressLog created → progress = 3/8 = 37.5%
Student answers Q2          → ProgressLog created → progress = 4/8 = 50.0%
...
Student answers Q5          → ProgressLog created → progress = 8/8 = 100% → COMPLETED
```

Progress formula:
```
progress = (completedSections + answeredQuestions) / (totalSections + totalQuestions) * 100
```
```

> **All cross-model references are string references (no FK constraints)** — same pattern used by `Content.userId`. This includes `Student.userId`, `Assignment.teacherId`, `Assignment.studentId`, and `Assignment.contentId`. Enforced at the application layer. The `User` model is **not modified** — it only stores login data.

### 3.3 Relationship Diagram

```
User (login data only)
  ├── userId referenced by: Admin, Teacher, Student (string ref, no FK)
  └── UsersOnRoles (FK — same auth-service DB)

Admin      → userId (string ref) → User
Teacher   → userId (string ref) → User   (Teacher)
Student    → userId (string ref) → User

Teacher (Teacher)
  └── creates Content
  └── creates Assignment ──> assigns Content to Student

Student
  └── has Assignment[]
  └── views assigned Content
  └── takes assigned Quizzes (future: quiz-service)

Assignment
  ├── teacherId  → Teacher.id  (string ref)
  ├── studentId  → Student.id   (string ref)
  ├── contentId  → Content.id   (string ref)
  ├── status     (ASSIGNED → IN_PROGRESS → COMPLETED)
  └── progress   (0-100%)
```

---

## 4. Permission Matrix (v2)

### 4.1 Updated ACL Subjects

```typescript
export enum AclSubject {
  ALL = 'All',
  USER = 'User',
  ROLE = 'Role',
  ADMIN = 'Admin',
  TEACHER = 'Teacher',       // Teacher
  STUDENT = 'Student',         // NEW
  CONTENT = 'Content',
  ASSIGNMENT = 'Assignment',   // NEW
  QUIZ = 'Quiz',               // NEW (future)
}
```

### 4.2 Role Permissions

| Action | SUPER_ADMIN | ADMIN | TEACHER (Teacher) | STUDENT |
|--------|:-----------:|:-----:|:------------------:|:-------:|
| **Student CRUD** | ✅ all | ✅ all | ✅ own students (via assignments) | Self read/update |
| **Content create** | ✅ | ✅ | ✅ | ❌ |
| **Content read** | ✅ all | ✅ all | ✅ own | ✅ assigned only |
| **Assignment create** | ✅ | ✅ | ✅ (own content only) | ❌ |
| **Assignment read** | ✅ all | ✅ all | ✅ own assignments | ✅ own assignments |
| **Assignment delete** | ✅ | ✅ | ✅ own | ❌ |
| **Progress update** | ❌ | ❌ | ❌ | ✅ own |
| **Quiz create** | ✅ | ✅ | ✅ (own content) | ❌ |
| **Quiz take** | ❌ | ❌ | ❌ | ✅ assigned only |

### 4.3 Seed Data

```typescript
{
  name: 'STUDENT',
  permissions: [
    // Self management
    createPermission(AclSubject.USER, AclAction.READ),
    createPermission(AclSubject.USER, AclAction.VIEW),
    createPermission(AclSubject.USER, AclAction.UPDATE, { id: '{{ id }}' }),

    // View assigned content only (enforced in student-service)
    createPermission(AclSubject.CONTENT, AclAction.READ),
    createPermission(AclSubject.CONTENT, AclAction.VIEW),

    // Own assignments
    createPermission(AclSubject.ASSIGNMENT, AclAction.READ),
    createPermission(AclSubject.ASSIGNMENT, AclAction.VIEW),
    createPermission(AclSubject.ASSIGNMENT, AclAction.UPDATE),  // progress

    // Future: quiz
    createPermission(AclSubject.QUIZ, AclAction.READ),
    createPermission(AclSubject.QUIZ, AclAction.VIEW),
  ],
}
```

---

## 5. Student Service Architecture

### 5.1 Service Structure

```
apps/student-service/
├── src/
│   ├── main.ts                            ← gRPC server (port 50054)
│   ├── app/
│   │   ├── student.module.ts
│   │   ├── student.controller.ts          ← gRPC handlers
│   │   ├── student.service.ts             ← Business logic
│   │   ├── repositories/
│   │   │   ├── student.repository.ts      ← Student CRUD
│   │   │   ├── assignment.repository.ts   ← Assignment CRUD
│   │   │   └── progress.repository.ts     ← ProgressLog + progress calculation
│   │   ├── interfaces/
│   │   │   ├── student.interface.ts
│   │   │   └── assignment.interface.ts
│   │   └── errors/
│   │       └── student.errors.ts
├── project.json
├── tsconfig.app.json
└── webpack.config.js
```

### 5.2 gRPC Port

| Service | Port |
|---------|------|
| auth-service | 50051 |
| content-service | 50052 |
| teacher-service | 50053 |
| **student-service** | **50054** |

### 5.3 Inter-Service Communication

```
                         ┌─────────────────┐
                         │   API Gateway    │ REST (port 3000)
                         └──┬──┬──┬──┬─────┘
                  gRPC      │  │  │  │
         ┌──────────────────┘  │  │  └──────────────────┐
         ▼                     ▼  ▼                     ▼
   ┌───────────┐     ┌──────────┐ ┌──────────┐   ┌───────────┐
   │   Auth    │     │ Content  │ │ Teacher │   │  Student  │
   │  Service  │     │ Service  │ │ (Teacher)│   │  Service  │
   │  :50051   │     │  :50052  │ │  :50053  │   │  :50054   │
   └───────────┘     └──────────┘ └──────────┘   └───────────┘
         │                                             │
         └─── CreateUser (student-service calls) ──────┘
```

---

## 6. Proto Definition

### `proto/student-service.proto`

```protobuf
syntax = "proto3";
package studentservice;

service StudentService {
  // ── Student CRUD ──
  rpc RegisterStudent(RegisterStudentRequest) returns (RegisterStudentResponse);
  rpc GetStudentById(GetStudentByIdRequest) returns (GetStudentByIdResponse);
  rpc GetStudentByUserId(GetStudentByUserIdRequest) returns (GetStudentByUserIdResponse);
  rpc UpdateStudent(UpdateStudentRequest) returns (UpdateStudentResponse);
  rpc DeleteStudent(DeleteStudentRequest) returns (DeleteStudentResponse);
  rpc GetAllStudents(GetAllStudentsRequest) returns (GetAllStudentsResponse);

  // ── Assignment management (teacher assigns content to student) ──
  rpc CreateAssignment(CreateAssignmentRequest) returns (CreateAssignmentResponse);
  rpc BulkCreateAssignments(BulkCreateAssignmentsRequest) returns (BulkCreateAssignmentsResponse);
  rpc DeleteAssignment(DeleteAssignmentRequest) returns (DeleteAssignmentResponse);
  rpc GetAssignment(GetAssignmentRequest) returns (GetAssignmentResponse);

  // ── Query assignments ──
  rpc GetStudentAssignments(GetStudentAssignmentsRequest) returns (GetStudentAssignmentsResponse);
  rpc GetTeacherAssignments(GetTeacherAssignmentsRequest) returns (GetTeacherAssignmentsResponse);
  rpc GetContentAssignments(GetContentAssignmentsRequest) returns (GetContentAssignmentsResponse);

  // ── Progress tracking (server-calculated) ──
  rpc UpdateProgress(UpdateProgressRequest) returns (UpdateProgressResponse);
  rpc GetProgressLogs(GetProgressLogsRequest) returns (GetProgressLogsResponse);
}

// ── Student messages ──

message Student {
  string id = 1;
  string user_id = 2;
  string unique_id = 3;
  string full_name = 4;
  optional string phone_number = 5;
  optional string date_of_birth = 6;
  optional string profile_picture_url = 7;
  optional string bio = 8;
  string active = 9;
  string created_at = 10;
  string updated_at = 11;
  optional string deleted_at = 12;
  optional User user = 13;
}

message User {
  string id = 1;
  string username = 2;
  string email = 3;
}

message RegisterStudentRequest {
  string username = 1;
  string email = 2;
  string password = 3;
  string full_name = 4;
  optional string phone_number = 5;
  optional string date_of_birth = 6;
}

message RegisterStudentResponse {
  Student student = 1;
}

message GetStudentByIdRequest { string id = 1; }
message GetStudentByIdResponse { Student student = 1; }

message GetStudentByUserIdRequest { string user_id = 1; }
message GetStudentByUserIdResponse { Student student = 1; }

message UpdateStudentRequest {
  string id = 1;
  optional string full_name = 2;
  optional string phone_number = 3;
  optional string date_of_birth = 4;
  optional string bio = 5;
}

message UpdateStudentResponse { Student student = 1; }

message DeleteStudentRequest { string id = 1; }
message DeleteStudentResponse { string message = 1; }

message GetAllStudentsRequest {
  optional int32 page = 1;
  optional int32 page_size = 2;
  optional string search = 3;
  optional string sort_by = 4;
  optional Order order = 5;
}

message GetAllStudentsResponse {
  repeated Student students = 1;
  PageMeta meta = 2;
}

// ── Assignment messages ──

enum AssignmentStatus {
  ASSIGNED = 0;
  IN_PROGRESS = 1;
  COMPLETED = 2;
  OVERDUE = 3;
}

message Assignment {
  string id = 1;
  string teacher_id = 2;
  string student_id = 3;
  string content_id = 4;
  AssignmentStatus status = 5;
  float progress = 6;
  optional string due_date = 7;
  string assigned_at = 8;
  optional string started_at = 9;
  optional string completed_at = 10;
  optional Student student = 11;
  string created_at = 12;
  string updated_at = 13;
}

message CreateAssignmentRequest {
  string teacher_id = 1;       // Teacher.id (from auth)
  string student_id = 2;
  string content_id = 3;
  optional string due_date = 4;
}

message CreateAssignmentResponse { Assignment assignment = 1; }

message BulkCreateAssignmentsRequest {
  string teacher_id = 1;
  repeated string student_ids = 2;   // assign same content to multiple students
  string content_id = 3;
  optional string due_date = 4;
}

message BulkCreateAssignmentsResponse {
  repeated Assignment assignments = 1;
  int32 created = 2;
  int32 skipped = 3;                 // already assigned
}

message DeleteAssignmentRequest {
  string teacher_id = 1;
  string student_id = 2;
  string content_id = 3;
}

message DeleteAssignmentResponse { string message = 1; }

message GetAssignmentRequest {
  string student_id = 1;
  string content_id = 2;
}

message GetAssignmentResponse { Assignment assignment = 1; }

// ── Query assignments ──

message GetStudentAssignmentsRequest {
  string student_id = 1;
  optional AssignmentStatus status = 2;
  optional int32 page = 3;
  optional int32 page_size = 4;
}

message GetStudentAssignmentsResponse {
  repeated Assignment assignments = 1;
  PageMeta meta = 2;
}

message GetTeacherAssignmentsRequest {
  string teacher_id = 1;
  optional string content_id = 2;    // filter by content
  optional AssignmentStatus status = 3;
  optional int32 page = 4;
  optional int32 page_size = 5;
}

message GetTeacherAssignmentsResponse {
  repeated Assignment assignments = 1;
  PageMeta meta = 2;
}

message GetContentAssignmentsRequest {
  string content_id = 1;
  optional int32 page = 2;
  optional int32 page_size = 3;
}

message GetContentAssignmentsResponse {
  repeated Assignment assignments = 1;
  PageMeta meta = 2;
  int32 total_assigned = 3;
}

// ── Progress ──

enum ProgressAction {
  COMPLETE_SECTION = 0;
  ANSWER_QUESTION = 1;
}

message UpdateProgressRequest {
  string student_id = 1;
  string content_id = 2;
  ProgressAction action = 3;              // what the student did
  optional string section_id = 4;         // required for COMPLETE_SECTION
  optional string question_id = 5;        // required for ANSWER_QUESTION
}

message UpdateProgressResponse {
  Assignment assignment = 1;              // updated assignment with new progress %
  bool already_logged = 2;                // true if this action was already recorded (idempotent)
}

message GetProgressLogsRequest {
  string assignment_id = 1;
}

message ProgressLog {
  string id = 1;
  string assignment_id = 2;
  optional string section_id = 3;
  optional string question_id = 4;
  ProgressAction action = 5;
  string created_at = 6;
}

message GetProgressLogsResponse {
  repeated ProgressLog logs = 1;
  float progress = 2;                     // current progress %
  int32 completed_items = 3;
  int32 total_items = 4;
}

// ── Shared ──

enum Order { ASC = 0; DESC = 1; }

message PageMeta {
  int32 page = 1;
  int32 page_size = 2;
  int32 count = 3;
  int32 page_count = 4;
  bool has_previous_page = 5;
  bool has_next_page = 6;
}
```

---

## 7. API Gateway — New Endpoints

### 7.1 Student Endpoints

```
POST   /api/v1/students                         ← Teacher/Admin: create student account
GET    /api/v1/students                         ← Admin/Teacher: list students
GET    /api/v1/students/:id                     ← Admin/Teacher or self
PUT    /api/v1/students/:id                     ← Admin or self
DELETE /api/v1/students/:id                     ← Admin only
```

### 7.2 Assignment Endpoints (Teacher-driven)

```
POST   /api/v1/assignments                     ← Teacher: assign content to student
POST   /api/v1/assignments/bulk                 ← Teacher: assign to multiple students
DELETE /api/v1/assignments/:studentId/:contentId ← Teacher: remove assignment

GET    /api/v1/assignments/my                   ← Student: my assigned content
GET    /api/v1/assignments/student/:studentId    ← Teacher/Admin: assignments for a specific student
GET    /api/v1/assignments/teacher              ← Teacher: assignments I created
GET    /api/v1/assignments/content/:contentId   ← Teacher: who has this content

PUT    /api/v1/assignments/progress             ← Student: log action (complete section / answer question)
GET    /api/v1/assignments/:studentId/:contentId/progress ← Student/Teacher: detailed progress logs
```

### 7.3 Controller Structure

```typescript
// apps/api-gateway/src/app/student/student.controller.ts
@Controller({ version: '1', path: 'students' })
export class StudentController {
  @Auth([{ action: AclAction.READ, subject: AclSubject.STUDENT }])
  @Get()
  async getAllStudents(@Query() options: GetAllStudentsDto) { ... }

  @Auth([{ action: AclAction.READ, subject: AclSubject.STUDENT }])
  @Get(':id')
  async getStudentById(@Param('id') id: string) { ... }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.STUDENT }])
  @Put(':id')
  async updateStudent(@Param('id') id: string, @Body() body: UpdateStudentDto) { ... }

  @Auth([{ action: AclAction.DELETE, subject: AclSubject.STUDENT }])
  @Delete(':id')
  async deleteStudent(@Param('id') id: string) { ... }
}

// apps/api-gateway/src/app/assignment/assignment.controller.ts
@Controller({ version: '1', path: 'assignments' })
export class AssignmentController {
  // Teacher creates assignment
  @Auth([{ action: AclAction.CREATE, subject: AclSubject.ASSIGNMENT }])
  @Post()
  async createAssignment(@AuthUser() user, @Body() body: CreateAssignmentDto) {
    // teacherId = get Teacher.id from user.userId
  }

  // Teacher bulk assigns
  @Auth([{ action: AclAction.CREATE, subject: AclSubject.ASSIGNMENT }])
  @Post('bulk')
  async bulkCreateAssignments(@AuthUser() user, @Body() body: BulkCreateAssignmentsDto) { ... }

  // Teacher removes assignment
  @Auth([{ action: AclAction.DELETE, subject: AclSubject.ASSIGNMENT }])
  @Delete(':studentId/:contentId')
  async deleteAssignment(@AuthUser() user, @Param() params) { ... }

  // Student: my assignments
  @Auth([{ action: AclAction.READ, subject: AclSubject.ASSIGNMENT }])
  @Get('my')
  async getMyAssignments(@AuthUser() user, @Query() options) { ... }

  // Teacher/Admin: assignments for a specific student
  @Auth([{ action: AclAction.READ, subject: AclSubject.ASSIGNMENT }])
  @Get('student/:studentId')
  async getStudentAssignments(@Param('studentId') studentId: string, @Query() options) { ... }

  // Teacher: assignments I created
  @Auth([{ action: AclAction.READ, subject: AclSubject.ASSIGNMENT }])
  @Get('teacher')
  async getTeacherAssignments(@AuthUser() user, @Query() options) { ... }

  // Teacher/Admin: who has this content
  @Auth([{ action: AclAction.READ, subject: AclSubject.ASSIGNMENT }])
  @Get('content/:contentId')
  async getContentAssignments(@Param('contentId') id, @Query() options) { ... }

  // Student: log progress action (complete section / answer question)
  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.ASSIGNMENT }])
  @Put('progress')
  async updateProgress(@AuthUser() user, @Body() body: UpdateProgressDto) {
    // body: { contentId, action: 'COMPLETE_SECTION' | 'ANSWER_QUESTION', sectionId?, questionId? }
    // Server creates ProgressLog, recalculates progress %, returns updated assignment
  }

  // Student/Teacher: view detailed progress logs for an assignment
  @Auth([{ action: AclAction.READ, subject: AclSubject.ASSIGNMENT }])
  @Get(':studentId/:contentId/progress')
  async getProgressLogs(@Param('studentId') studentId: string, @Param('contentId') contentId: string) {
    // Returns: { logs[], progress %, completedItems, totalItems }
  }
}
```

---

## 8. Registration Flow (Teacher-Only)

> **No self-registration.** Only teachers (TEACHER role) and admins can create student accounts.

### 8.1 Teacher Creates Student

```
1. Teacher (performa-studio) → POST /api/v1/students
     { username, email, password, fullName, phoneNumber?, dateOfBirth? }

2. API Gateway (student.controller.ts):
   a. Verify caller has TEACHER or ADMIN role
   b. Call auth-service.CreateUser(username, email, password, roleIds=[STUDENT_ROLE_ID])
   c. Call student-service.RegisterStudent(userId, fullName, phoneNumber, dateOfBirth)
   d. If step (c) fails → rollback: auth-service.DeleteUserById(userId)
   e. Return { student }

3. Teacher shares credentials with student out-of-band
4. Student logs in via POST /api/v1/auth/login → gets JWT with STUDENT role
```

### 8.2 Adding STUDENT Role to Existing User (Multi-Role)

```
1. Teacher → POST /api/v1/students
     { userId: "existing_user_id", fullName }   // existing user, add STUDENT role

2. API Gateway:
   a. Check user already exists
   b. Add STUDENT role to user via auth-service.AddRoleToUser(userId, STUDENT_ROLE_ID)
   c. Call student-service.RegisterStudent(userId, fullName, ...)
   d. Return { student }

3. User now has both TEACHER + STUDENT roles
```

---

## 9. Assignment Flow (Core Feature)

### 9.1 Teacher Assigns Content to Student

```
1. Teacher → POST /api/v1/assignments
     { studentId: "stu_123", contentId: "content_456", dueDate?: "2026-04-01" }

2. API Gateway → student-service.CreateAssignment(teacherId, studentId, contentId, dueDate)

3. Student Service:
   a. Validate student exists and is active
   b. Validate no duplicate assignment (unique constraint)
   c. Create Assignment record (status: ASSIGNED)
   d. Return assignment

4. Student now sees this content in their assigned list
```

### 9.2 Teacher Bulk Assigns Content

```
1. Teacher → POST /api/v1/assignments/bulk
     { studentIds: ["stu_1", "stu_2", "stu_3"], contentId: "content_456", dueDate?: ... }

2. Student Service:
   a. For each studentId: create assignment (skip if already exists)
   b. Return { assignments, created: 3, skipped: 0 }
```

### 9.3 Student Consumes Content (Server-Calculated Progress)

**Progress is server-calculated, not client-sent.** Each action (complete section, answer question) creates a `ProgressLog` entry. The server counts completed items vs total items to derive the percentage.

```
1. Student → GET /api/v1/assignments/my
   → Returns list of assigned content with status and progress %

2. Student opens content, completes a section:
   → PUT /api/v1/assignments/progress
     { contentId: "content_456", action: "COMPLETE_SECTION", sectionId: "section_789" }

3. Student answers a quiz question:
   → PUT /api/v1/assignments/progress
     { contentId: "content_456", action: "ANSWER_QUESTION", questionId: "q_123" }

4. Student Service (on each call):
   a. Find assignment by (studentId, contentId)
   b. Check if ProgressLog already exists (idempotent — skip if duplicate)
   c. Create ProgressLog entry
   d. Count total items: content-service.GetContentSections(contentId) → totalSections
      + quiz-service.GetQuizQuestionCount(contentId) → totalQuestions (future)
   e. Count completed items: ProgressLog.count(assignmentId)
   f. Calculate progress = completedItems / totalItems * 100
   g. Update assignment.progress and assignment.status:
      - First update → status = IN_PROGRESS, set startedAt
      - progress = 100 → status = COMPLETED, set completedAt
   h. Return updated assignment + whether it was already logged
```

**Why server-calculated?**
- Client can't fake progress (e.g., send `progress: 100` without doing anything)
- Each action is idempotent (unique constraint on assignment+section or assignment+question)
- Clear audit trail — `ProgressLog` shows exactly what the student did and when
- Progress updates on every question answer are just `ANSWER_QUESTION` actions

### 9.4 Content Visibility Rules

| Role | Can See |
|------|---------|
| SUPER_ADMIN / ADMIN | All content |
| TEACHER (Teacher) | Own created content |
| STUDENT | **Only content assigned to them** |

The student's "content feed" is driven entirely by the `assignments` table:
```sql
SELECT a.*, c.title, c.thumbnail_url
FROM assignments a
JOIN content c ON a.content_id = c.id
WHERE a.student_id = :studentId
  AND a.status != 'OVERDUE'
ORDER BY a.assigned_at DESC
```

---

## 10. Auth Service Changes

### 10.1 `getMe` — Handle STUDENT Role

```typescript
// auth.repository.ts → getMe()
// Add STUDENT handling alongside TEACHER and ADMIN

if (roles.includes('STUDENT')) {
  const student = await this.prisma.student.findFirst({
    where: { userId: id, deletedAt: null },
  });
  return {
    id: student?.id ?? null,
    uniqueId: student?.uniqueId ?? '',
    fullName: student?.fullName ?? '',
    profilePicture: student?.profilePictureUrl ?? null,
    dateOfBirth: student?.dateOfBirth?.toISOString() ?? null,
    phoneNumber: student?.phoneNumber ?? null,
    // ... common fields
  };
}
```

### 10.2 `updateProfile` — Handle STUDENT Role

```typescript
// auth.repository.ts → updateProfile()
if (roles.includes('STUDENT')) {
  await this.prisma.student.update({
    where: { userId: options.userId },
    data: {
      fullName: options.fullName ?? undefined,
      profilePictureUrl: options.profilePictureUrl ?? undefined,
      bio: options.bio ?? undefined,
    },
  });
}
```

---

## 11. Docker Compose Changes

```yaml
# Add to docker-compose.yml

student-service:
  build:
    context: .
    dockerfile: deploy/Dockerfile
    args:
      SERVICE_NAME: student-service
  ports:
    - "50054:50054"
  environment:
    - NODE_ENV=development
    - DATABASE_URL=${DATABASE_URL}
    - AUTH_SERVICE_GRPC_HOST=auth-service
    - AUTH_SERVICE_GRPC_PORT=50051
    - STUDENT_SERVICE_GRPC_PORT=50054
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  volumes:
    - ./apps/student-service/src:/app/apps/student-service/src
    - ./libs/src:/app/libs/src
    - ./proto:/app/proto
  networks:
    - performa-network

# Add to api-gateway environment:
# api-gateway:
#   environment:
#     - STUDENT_SERVICE_GRPC_HOST=student-service
#     - STUDENT_SERVICE_GRPC_PORT=50054
```

---

## 12. Full Change Inventory

### 12.1 New Files

| File | Description |
|------|-------------|
| `proto/student-service.proto` | gRPC service definition |
| `types/proto/student-service.ts` | Generated TypeScript types |
| `apps/student-service/` (entire app) | NestJS gRPC service |
| `apps/api-gateway/src/app/student/` | Student REST controller |
| `apps/api-gateway/src/app/assignment/` | Assignment REST controller |
| `libs/src/zod-dtos/student-dtos/register-student.dto.ts` | Registration validation |
| `libs/src/zod-dtos/assignment-dtos/` | Assignment DTOs |
| `libs/src/prisma/migrations/xxx_add_student_and_assignment/` | DB migration |

### 12.2 Modified Files

| File | Change |
|------|--------|
| `libs/src/prisma/schema.prisma` | Add Student, Assignment models + enums (no User relation — string refs only) |
| `libs/src/prisma/seed.ts` | Add STUDENT role with permissions |
| `libs/src/constant/acl.ts` | Add STUDENT, ASSIGNMENT, QUIZ subjects |
| `libs/src/zod-dtos/student-dtos/index.ts` | Export new DTOs |
| `apps/api-gateway/src/app/app.module.ts` | Register student-service gRPC client + controllers |
| `apps/api-gateway/src/app/auth/auth.controller.ts` | Handle STUDENT role in login response |
| `apps/auth-service/src/app/repositories/auth.repository.ts` | Handle STUDENT in getMe + updateProfile |
| `docker-compose.yml` | Add student-service container |
| `docker-compose.prod.yml` | Add student-service production config |
| `deploy/student-service.yaml` | Cloud Run manifest |
| `Makefile` | Add `make student` command |

---

## 13. Implementation Order

| Phase | Step | Task | Files |
|-------|------|------|-------|
| **DB** | 1 | Add Student + Assignment models to Prisma schema | `schema.prisma` |
| | 2 | Run `prisma migrate dev --name add_student_and_assignment` | migration file |
| | 3 | Add STUDENT role + ACL subjects to seed & constants | `seed.ts`, `acl.ts` |
| | 4 | Run `make db-seed` | — |
| **Proto** | 5 | Create `proto/student-service.proto` | proto file |
| | 6 | Run `pnpm generate-proto-types` | `types/proto/student-service.ts` |
| **Service** | 7 | Scaffold student-service app (Nx or manual) | `apps/student-service/` |
| | 8 | Implement `main.ts` — gRPC server on port 50054 | bootstrap |
| | 9 | Implement `student.repository.ts` — Student CRUD | repository |
| | 10 | Implement `assignment.repository.ts` — Assignment CRUD + progress | repository |
| | 11 | Implement `student.service.ts` — orchestration + auth-service calls | service |
| | 12 | Implement `student.controller.ts` — gRPC handlers | controller |
| **DTOs** | 13 | Create student + assignment DTOs in libs | zod schemas |
| **Gateway** | 14 | Add student-service gRPC client to app.module.ts | module |
| | 15 | Create StudentController in api-gateway | REST endpoints |
| | 16 | Create AssignmentController in api-gateway | REST endpoints |
| | 17 | Handle STUDENT role in auth login response | auth controller |
| **Auth** | 18 | Update auth-service `getMe` for STUDENT role | auth repository |
| | 19 | Update auth-service `updateProfile` for STUDENT role | auth repository |
| **Infra** | 20 | Update docker-compose.yml | container config |
| | 21 | Update Makefile | commands |
| | 22 | Add Cloud Run manifest | deploy/ |

---

## 14. Future: Quiz Service Integration

Once student-service is running, quiz-service builds on top:

```
Teacher creates Quiz (linked to Content/Section)
    ↓
Teacher assigns Content to Student (already includes quizzes)
    ↓
Student opens assigned content → sees quizzes
    ↓
Student takes quiz → quiz-service grades it
    ↓
Quiz-service calls student-service.UpdateProgress()
    ↓
Assignment progress reflects quiz score
```

The quiz-service proto (already documented in `quiz-service-approach.md`) will:
- Use the same shared Postgres DB
- Reference `contentId` and `sectionId` from content-service
- Call `student-service.UpdateProgress()` after grading

---

## 15. Mobile App (performa-app) Impact

The Expo/React Native app (`performa-app`) is the student-facing frontend:

| Screen | API Call |
|--------|----------|
| Login | `POST /api/v1/auth/login` (teacher creates account, student just logs in) |
| My Assignments | `GET /api/v1/assignments/my` |
| Content Detail | `GET /api/v1/contents/:id` (only if assigned) |
| Watch Video | Stream HLS from S3 |
| Update Progress | `PUT /api/v1/assignments/progress` |
| Take Quiz | (future) quiz-service endpoints |
| Profile | `GET /api/v1/auth/getMe`, `PUT /api/v1/auth/profile` |

---

## 16. Open Decisions

| # | Question | Options |
|---|----------|---------|---------|
| 1 | **Can a teacher also be a student?** | ✅ **Yes** — multi-role. A User can have both TEACHER + STUDENT roles. | User gets both role entries in `users_on_roles`. Auth `getMe` returns combined profile. UI adapts based on active role. |
| 2 | **Student registration** — public or teacher-only? | ✅ **B: Teacher-only.** Teachers create student accounts. No public self-registration. | Remove `POST /auth/register-student` (public). Keep `POST /students` (teacher creates). Teacher provides credentials to student out-of-band. |
| 3 | **Assignment notifications** — how to notify students? | ✅ **B: In-app polling** for now. Push + Email in future. | Student app polls `GET /assignments/my`. Future: add notification-service with FCM push + email (SendGrid/SES). |
| 4 | **Content access control** — enforce at API gateway or content-service? | ✅ **A: API Gateway.** Gateway checks assignment before forwarding to content-service. | Gateway calls `student-service.GetAssignment(studentId, contentId)` → exists? forward to content-service → else 403. Content-service stays role-unaware. Use Redis cache to mitigate extra gRPC call. |

---

## Decisions Impact on Architecture

### Multi-role (Decision 1)
- `UsersOnRoles` already supports multiple roles per user — no schema change needed
- Auth `getMe` must detect all roles and return a combined/merged profile
- performa-studio: teacher sees "Switch to Student view" (or vice versa)
- performa-app: student who is also a teacher can switch context

### Teacher-only Registration (Decision 2)
- **Remove** `POST /api/v1/auth/register-student` from API gateway
- **Keep** `POST /api/v1/students` — requires TEACHER (Teacher) or ADMIN auth
- Registration flow: Teacher creates student → student-service generates `STU_XXXXX` unique ID → teacher shares credentials with student
- Student logs in via `POST /api/v1/auth/login` (existing endpoint)

---

## Next Step

All decisions confirmed. Start implementing from Phase 1 (database models → service → gateway).