-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ProgressAction" AS ENUM ('COMPLETE_SECTION', 'ANSWER_QUESTION');

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "unique_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_number" VARCHAR(15),
    "date_of_birth" DATE,
    "profile_picture_url" VARCHAR(500),
    "bio" TEXT,
    "active" "ActiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "due_date" TIMESTAMPTZ,
    "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_logs" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "section_id" TEXT,
    "question_id" TEXT,
    "action" "ProgressAction" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_unique_id_key" ON "students"("unique_id");

-- CreateIndex
CREATE INDEX "assignments_teacher_id_idx" ON "assignments"("teacher_id");

-- CreateIndex
CREATE INDEX "assignments_content_id_idx" ON "assignments"("content_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_student_id_content_id_key" ON "assignments"("student_id", "content_id");

-- CreateIndex
CREATE INDEX "progress_logs_assignment_id_idx" ON "progress_logs"("assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "progress_logs_assignment_id_section_id_action_key" ON "progress_logs"("assignment_id", "section_id", "action");

-- CreateIndex
CREATE UNIQUE INDEX "progress_logs_assignment_id_question_id_action_key" ON "progress_logs"("assignment_id", "question_id", "action");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
