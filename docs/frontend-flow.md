# Frontend Flow — Student Management, Assignment & Quiz

> **Branch**: `revamp-v2`
> **Date**: 2026-03-27
> **Depends on**: [student-service-approach.md](./student-service-approach.md), [quiz-service-approach.md](./quiz-service-approach.md)

---

## 1. Overview

This document covers the full frontend implementation for three flows:

1. **Teacher registers a student** (performa-studio)
2. **Teacher assigns content/quiz to student** (performa-studio)
3. **Teacher creates a quiz for content** (performa-studio)

---

## 2. Tech Stack Reference

| | performa-studio (Teacher) |
|---|---|
| **Framework** | React 19 + Vite |
| **Routing** | TanStack Router (file-based) |
| **Data Fetching** | TanStack Query + Axios |
| **State** | Zustand (auth + forms) |
| **Forms** | TanStack Form + Zustand store + Zod validation |
| **UI** | Shadcn/UI (Radix + Tailwind) |

---

## 3. Flow 1 — Teacher Registers a Student (performa-studio)

### 3.1 New Routes

```
src/routes/(dashboard)/dashboard/students/
├── index.tsx              ← Student list (table with search/pagination)
├── create.tsx             ← Create student form
└── $id.tsx                ← Student detail / edit
```

### 3.2 API Layer

```typescript
// lib/api.ts — add studentApi

export const studentApi = {
  getAll: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }) => apiClient.get<StudentListResponse>('/students', { params }),

  getById: (id: string) =>
    apiClient.get<StudentResponse>(`/students/${id}`),

  create: (data: CreateStudentPayload) =>
    apiClient.post<StudentResponse>('/students', data),

  update: (id: string, data: UpdateStudentPayload) =>
    apiClient.put<StudentResponse>(`/students/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/students/${id}`),
};
```

```typescript
// Types

interface CreateStudentPayload {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string; // ISO date
}

interface Student {
  id: string;
  userId: string;
  uniqueId: string;      // STU_XXXXX
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  profilePictureUrl?: string;
  bio?: string;
  active: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

interface StudentListResponse {
  students: Student[];
  meta: PageMeta;
}

interface StudentResponse {
  student: Student;
}
```

### 3.3 Query Hooks

Uses the project's `useApiQuery` / `useApiMutation` wrappers from `hooks/use-api.ts`.

```typescript
// hooks/use-students.ts

import { useApiQuery, useApiMutation } from './use-api';
import { studentApi } from '../lib/api';

export function useStudents(params?: StudentListParams) {
  return useApiQuery(
    ['students', params?.page, params?.pageSize, params?.search],
    () => studentApi.getAll(params),
  );
}

export function useStudent(id: string) {
  return useApiQuery(
    ['student', id],
    () => studentApi.getById(id),
    { enabled: !!id },
  );
}

export function useCreateStudent() {
  return useApiMutation(studentApi.create, {
    invalidateQueries: ['students'],
    onSuccess: () => {
      toast.success('Student created successfully');
    },
  });
}

export function useUpdateStudent() {
  return useApiMutation(
    ({ id, data }: { id: string; data: UpdateStudentPayload }) => studentApi.update(id, data),
    {
      invalidateQueries: ['students'],
      onSuccess: () => {
        toast.success('Student updated successfully');
      },
    },
  );
}

export function useDeleteStudent() {
  return useApiMutation(studentApi.delete, {
    invalidateQueries: ['students'],
    onSuccess: () => {
      toast.success('Student deleted');
    },
  });
}
```

### 3.4 Validation Schema

```typescript
// validations/student.ts

import { z } from 'zod';

export const createStudentSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  fullName: z
    .string()
    .min(2, 'Full name is required')
    .max(100),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z
    .string()
    .optional()
    .or(z.literal('')),
});

export type CreateStudentFormData = z.infer<typeof createStudentSchema>;
```

### 3.5 Student List Page

```
┌─────────────────────────────────────────────────┐
│  Students                          [+ Add Student] │
├─────────────────────────────────────────────────┤
│  🔍 Search students...                            │
├─────────────────────────────────────────────────┤
│  ID         │ Name          │ Email       │ Status│
│  STU_00001  │ John Doe      │ john@...    │ ✅    │
│  STU_00002  │ Jane Smith    │ jane@...    │ ✅    │
│  STU_00003  │ Bob Wilson    │ bob@...     │ ❌    │
├─────────────────────────────────────────────────┤
│  ← 1 2 3 ... 10 →                      12/page  │
└─────────────────────────────────────────────────┘
```

```typescript
// routes/(dashboard)/dashboard/students/index.tsx

export default function StudentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data, isLoading } = useStudents({ page, pageSize: 12, search });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Students</h1>
        <Button onClick={() => navigate({ to: '/dashboard/students/create' })}>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      <Input
        placeholder="Search students..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
      />

      <PerformaTable
        columns={studentColumns}
        data={data?.students ?? []}
        meta={data?.meta}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowClick={(student) =>
          navigate({ to: '/dashboard/students/$id', params: { id: student.id } })
        }
      />
    </div>
  );
}
```

### 3.6 Create Student Form

```
┌─────────────────────────────────────────────────┐
│  ← Back    Create Student                        │
├─────────────────────────────────────────────────┤
│                                                   │
│  Full Name *                                      │
│  ┌─────────────────────────────────────────┐      │
│  │ John Doe                                 │      │
│  └─────────────────────────────────────────┘      │
│                                                   │
│  Email *                                          │
│  ┌─────────────────────────────────────────┐      │
│  │ john@example.com                         │      │
│  └─────────────────────────────────────────┘      │
│                                                   │
│  Username *                                       │
│  ┌─────────────────────────────────────────┐      │
│  │ johndoe                                  │      │
│  └─────────────────────────────────────────┘      │
│                                                   │
│  Password *                                       │
│  ┌─────────────────────────────────────────┐      │
│  │ ••••••••         👁                      │      │
│  └─────────────────────────────────────────┘      │
│                                                   │
│  Phone Number (optional)                          │
│  ┌─────────────────────────────────────────┐      │
│  │ +6281234567890                            │      │
│  └─────────────────────────────────────────┘      │
│                                                   │
│  Date of Birth (optional)                         │
│  ┌─────────────────────────────────────────┐      │
│  │ 📅 2000-01-15                            │      │
│  └─────────────────────────────────────────┘      │
│                                                   │
│                           [Cancel]  [Create]      │
└─────────────────────────────────────────────────┘
```

```typescript
// routes/(dashboard)/dashboard/students/create.tsx

export default function CreateStudentPage() {
  const navigate = useNavigate();
  const { mutate: createStudent, isPending } = useCreateStudent();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<CreateStudentFormData>({
    fullName: '',
    email: '',
    username: '',
    password: '',
    phoneNumber: '',
    dateOfBirth: '',
  });

  const handleSubmit = () => {
    const result = createStudentSchema.safeParse(form);
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((i) => [i.path[0], i.message])
        )
      );
      return;
    }
    setErrors({});
    createStudent(result.data, {
      onSuccess: () => navigate({ to: '/dashboard/students' }),
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate({ to: '/dashboard/students' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Create Student</h1>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <FormField label="Full Name" error={errors.fullName} required>
            <Input value={form.fullName} onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))} />
          </FormField>

          <FormField label="Email" error={errors.email} required>
            <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
          </FormField>

          <FormField label="Username" error={errors.username} required>
            <Input value={form.username} onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))} />
          </FormField>

          <FormField label="Password" error={errors.password} required>
            <PasswordInput value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} />
          </FormField>

          <FormField label="Phone Number" error={errors.phoneNumber}>
            <Input value={form.phoneNumber} onChange={(e) => setForm(f => ({ ...f, phoneNumber: e.target.value }))} />
          </FormField>

          <FormField label="Date of Birth" error={errors.dateOfBirth}>
            <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
          </FormField>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate({ to: '/dashboard/students' })}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Creating...' : 'Create'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### 3.7 Success Flow

```
Teacher fills form → clicks "Create"
  ↓
Zod validates → errors shown inline if invalid
  ↓
POST /api/v1/students → backend creates User (STUDENT role) + Student record
  ↓
onSuccess:
  1. Toast: "Student created successfully"
  2. Invalidate ['students'] query (list refreshes)
  3. Navigate to /dashboard/students
  ↓
Teacher sees new student in list with STU_XXXXX ID
  ↓
Teacher shares credentials with student (out-of-band: verbal, email, etc.)
```

---

## 4. Flow 2 — Teacher Assigns Content to Student (performa-studio)

### 4.1 New Routes

```
src/routes/(dashboard)/dashboard/
├── students/
│   └── $id.tsx                ← Student detail (shows assignments)
├── studio/
│   └── $id.tsx                ← Content detail (add "Assign" button)
└── assignments/
    └── index.tsx              ← Teacher's assignment overview
```

### 4.2 API Layer

```typescript
// lib/api.ts — add assignmentApi

export const assignmentApi = {
  // Teacher creates assignment
  create: (data: CreateAssignmentPayload) =>
    apiClient.post<AssignmentResponse>('/assignments', data),

  // Teacher bulk assigns to multiple students
  bulkCreate: (data: BulkCreateAssignmentPayload) =>
    apiClient.post<BulkAssignmentResponse>('/assignments/bulk', data),

  // Teacher removes assignment
  delete: (studentId: string, contentId: string) =>
    apiClient.delete(`/assignments/${studentId}/${contentId}`),

  // Teacher: my assignments
  getTeacherAssignments: (params?: AssignmentListParams) =>
    apiClient.get<AssignmentListResponse>('/assignments/teacher', { params }),

  // Teacher: assignments for a specific student
  getStudentAssignments: (studentId: string, params?: AssignmentListParams) =>
    apiClient.get<AssignmentListResponse>(`/assignments/student/${studentId}`, { params }),

  // Teacher: who has this content
  getContentAssignments: (contentId: string, params?: AssignmentListParams) =>
    apiClient.get<ContentAssignmentResponse>(`/assignments/content/${contentId}`, { params }),

  // Progress logs for a specific assignment
  getProgressLogs: (studentId: string, contentId: string) =>
    apiClient.get<ProgressLogsResponse>(`/assignments/${studentId}/${contentId}/progress`),
};
```

```typescript
// Types

interface CreateAssignmentPayload {
  studentId: string;
  contentId: string;
  dueDate?: string;
}

interface BulkCreateAssignmentPayload {
  studentIds: string[];
  contentId: string;
  dueDate?: string;
}

interface Assignment {
  id: string;
  teacherId: string;
  studentId: string;
  contentId: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  progress: number;
  dueDate?: string;
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  student?: Student;
  createdAt: string;
  updatedAt: string;
}

interface AssignmentListResponse {
  assignments: Assignment[];
  meta: PageMeta;
}

interface BulkAssignmentResponse {
  assignments: Assignment[];
  created: number;
  skipped: number;
}

interface ProgressLog {
  id: string;
  assignmentId: string;
  sectionId?: string;
  questionId?: string;
  action: 'COMPLETE_SECTION' | 'ANSWER_QUESTION';
  createdAt: string;
}

interface ProgressLogsResponse {
  logs: ProgressLog[];
  progress: number;
  completedItems: number;
  totalItems: number;
}
```

### 4.3 Query Hooks

Uses the project's `useApiQuery` / `useApiMutation` wrappers from `hooks/use-api.ts`.

```typescript
// hooks/use-assignments.ts

import { useApiQuery, useApiMutation } from './use-api';
import { assignmentApi } from '../lib/api';

export function useTeacherAssignments(params?: AssignmentListParams) {
  return useApiQuery(
    ['teacher-assignments', params],
    () => assignmentApi.getTeacherAssignments(params),
  );
}

export function useStudentAssignments(studentId: string) {
  return useApiQuery(
    ['student-assignments', studentId],
    () => assignmentApi.getStudentAssignments(studentId),
    { enabled: !!studentId },
  );
}

export function useContentAssignments(contentId: string) {
  return useApiQuery(
    ['content-assignments', contentId],
    () => assignmentApi.getContentAssignments(contentId),
    { enabled: !!contentId },
  );
}

export function useCreateAssignment() {
  return useApiMutation(assignmentApi.create, {
    invalidateQueries: ['teacher-assignments', 'student-assignments', 'content-assignments'],
    onSuccess: () => {
      toast.success('Content assigned successfully');
    },
  });
}

export function useBulkCreateAssignment() {
  return useApiMutation(assignmentApi.bulkCreate, {
    invalidateQueries: ['teacher-assignments', 'student-assignments', 'content-assignments'],
    onSuccess: (data) => {
      toast.success(`Assigned to ${data.created} students (${data.skipped} skipped)`);
    },
  });
}

export function useDeleteAssignment() {
  return useApiMutation(
    ({ studentId, contentId }: { studentId: string; contentId: string }) =>
      assignmentApi.delete(studentId, contentId),
    {
      invalidateQueries: ['teacher-assignments', 'student-assignments', 'content-assignments'],
      onSuccess: () => {
        toast.success('Assignment removed');
      },
    },
  );
}

export function useProgressLogs(studentId: string, contentId: string) {
  return useApiQuery(
    ['progress-logs', studentId, contentId],
    () => assignmentApi.getProgressLogs(studentId, contentId),
    { enabled: !!studentId && !!contentId },
  );
}
```

### 4.4 Assign from Content Detail Page

The existing content detail page (`/dashboard/studio/:id`) gets a new "Assign to Students" button.

```
┌─────────────────────────────────────────────────┐
│  ← Back    React Native Fundamentals             │
│            Published  •  3 sections  •  12 videos │
├─────────────────────────────────────────────────┤
│  [Edit]  [Assign to Students]  [Delete]          │
├─────────────────────────────────────────────────┤
│                                                   │
│  Assigned Students (3)                            │
│  ┌───────────────────────────────────────────┐    │
│  │ STU_00001  John Doe    ██████░░░░  60%   │    │
│  │ STU_00002  Jane Smith  ████████░░  80%   │    │
│  │ STU_00003  Bob Wilson  ░░░░░░░░░░  0%    │    │
│  └───────────────────────────────────────────┘    │
│                                                   │
│  Sections                                         │
│  ▼ Section 1: Introduction (3 videos)             │
│  ▶ Section 2: Core Concepts (5 videos)            │
│  ▶ Section 3: Advanced Topics (4 videos)          │
└─────────────────────────────────────────────────┘
```

### 4.5 Assign Dialog (Sheet)

Clicking "Assign to Students" opens a sheet/dialog:

```
┌─────────────────────────────────────────────────┐
│  Assign "React Native Fundamentals"              │
├─────────────────────────────────────────────────┤
│                                                   │
│  Select Students                                  │
│  🔍 Search students...                            │
│  ┌───────────────────────────────────────────┐    │
│  │ ☑ STU_00001  John Doe      (already)     │    │
│  │ ☐ STU_00004  Alice Brown                  │    │
│  │ ☐ STU_00005  Charlie Lee                  │    │
│  │ ☑ STU_00006  Diana Ross                   │    │
│  │ ☐ STU_00007  Eve Davis                    │    │
│  └───────────────────────────────────────────┘    │
│                                                   │
│  Due Date (optional)                              │
│  ┌─────────────────────────────────────────┐      │
│  │ 📅 2026-04-15                            │      │
│  └─────────────────────────────────────────┘      │
│                                                   │
│  Selected: 2 new students                         │
│                                                   │
│                    [Cancel]  [Assign (2)]          │
└─────────────────────────────────────────────────┘
```

```typescript
// components/assign-content-sheet.tsx

interface AssignContentSheetProps {
  contentId: string;
  contentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignContentSheet({ contentId, contentTitle, open, onOpenChange }: AssignContentSheetProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');

  // All students
  const { data: studentsData } = useStudents({ search, pageSize: 50 });
  // Already assigned students
  const { data: assignedData } = useContentAssignments(contentId);

  const alreadyAssigned = new Set(assignedData?.assignments.map((a) => a.studentId) ?? []);
  const { mutate: bulkAssign, isPending } = useBulkCreateAssignment();

  const newSelections = selectedIds.filter((id) => !alreadyAssigned.has(id));

  const handleAssign = () => {
    if (newSelections.length === 0) return;
    bulkAssign(
      { studentIds: newSelections, contentId, dueDate: dueDate || undefined },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px]">
        <SheetHeader>
          <SheetTitle>Assign "{contentTitle}"</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} />

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {studentsData?.students.map((student) => (
              <label key={student.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted">
                <Checkbox
                  checked={selectedIds.includes(student.id) || alreadyAssigned.has(student.id)}
                  disabled={alreadyAssigned.has(student.id)}
                  onCheckedChange={(checked) => {
                    setSelectedIds((prev) =>
                      checked ? [...prev, student.id] : prev.filter((id) => id !== student.id)
                    );
                  }}
                />
                <div>
                  <p className="font-medium">{student.fullName}</p>
                  <p className="text-sm text-muted-foreground">{student.uniqueId}</p>
                </div>
                {alreadyAssigned.has(student.id) && (
                  <Badge variant="secondary" className="ml-auto">Already assigned</Badge>
                )}
              </label>
            ))}
          </div>

          <FormField label="Due Date (optional)">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </FormField>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={isPending || newSelections.length === 0}>
            {isPending ? 'Assigning...' : `Assign (${newSelections.length})`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

### 4.6 Student Detail Page — Assignments Tab

```
┌─────────────────────────────────────────────────┐
│  ← Back    John Doe (STU_00001)                  │
│            john@example.com • Active              │
├─────────────────────────────────────────────────┤
│  [Profile]  [Assignments]                        │
├─────────────────────────────────────────────────┤
│                                                   │
│  Assigned Content (3)        [+ Assign Content]   │
│  ┌───────────────────────────────────────────┐    │
│  │ 📚 React Native Fundamentals              │    │
│  │    ██████░░░░ 60%  •  IN_PROGRESS         │    │
│  │    Due: Apr 15  •  Started: Mar 22         │    │
│  │    [View Progress]  [Remove]               │    │
│  ├───────────────────────────────────────────┤    │
│  │ 📚 TypeScript Advanced                    │    │
│  │    ░░░░░░░░░░ 0%   •  ASSIGNED            │    │
│  │    Due: May 01  •  Not started             │    │
│  │    [View Progress]  [Remove]               │    │
│  ├───────────────────────────────────────────┤    │
│  │ 📚 System Design Basics                   │    │
│  │    ██████████ 100% •  COMPLETED ✅        │    │
│  │    Completed: Mar 20                       │    │
│  │    [View Progress]                         │    │
│  └───────────────────────────────────────────┘    │
│                                                   │
└─────────────────────────────────────────────────┘
```

### 4.7 Progress Detail Dialog

Clicking "View Progress" opens a dialog showing the `ProgressLog` entries:

```
┌─────────────────────────────────────────────────┐
│  Progress: React Native Fundamentals             │
│  Student: John Doe (STU_00001)                   │
├─────────────────────────────────────────────────┤
│                                                   │
│  ██████░░░░ 60%  (6/10 items)                    │
│                                                   │
│  ✅ Section 1: Introduction          Mar 22 10:30│
│  ✅ Section 2: Core Concepts         Mar 22 11:15│
│  ✅ Section 3: Advanced Topics       Mar 23 09:00│
│  ✅ Quiz Q1: What is React Native?   Mar 23 09:10│
│  ✅ Quiz Q2: Explain JSX             Mar 23 09:12│
│  ✅ Quiz Q3: State vs Props          Mar 23 09:15│
│  ⬜ Quiz Q4: useEffect lifecycle                 │
│  ⬜ Quiz Q5: Navigation              │
│  ⬜ Section 4: Deployment                        │
│  ⬜ Quiz Q6: Build process                       │
│                                                   │
│                                       [Close]    │
└─────────────────────────────────────────────────┘
```

### 4.8 Assignment Flow

```
Teacher opens content detail (/dashboard/studio/:id)
  ↓
Clicks "Assign to Students" → AssignContentSheet opens
  ↓
Searches/selects students → sets optional due date
  ↓
Clicks "Assign (N)"
  ↓
POST /api/v1/assignments/bulk
  { studentIds: [...], contentId: "...", dueDate?: "..." }
  ↓
onSuccess:
  1. Toast: "Assigned to 3 students (1 skipped)"
  2. Invalidate assignment queries
  3. Sheet closes
  4. Assigned students list updates on content detail page
  ↓
Students now see this content in their app (GET /assignments/my)
```

---

## 5. Flow 3 — Teacher Creates Quiz (performa-studio)

Quiz is a **standalone content type** with its own sidebar entry under the dashboard, separate from the video/document studio. Quizzes appear alongside Studio, Students, Assignments, etc. in the sidebar navigation.

### 5.1 New Routes

```
src/routes/(dashboard)/dashboard/
├── quizzes.tsx                        ← Quiz list (table with search/pagination/filter)
├── quizzes_.create.tsx                ← Quiz creation page (wizard)
└── quizzes_.$quizId.tsx               ← Quiz detail / edit
```

### 5.2 API Layer

```typescript
// lib/api.ts — add quizApi

export const quizApi = {
  // Quiz CRUD
  getAll: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    isPublished?: boolean;
  }) => apiClient.get<QuizListResponse>('/quizzes', { params }),

  getById: (quizId: string) =>
    apiClient.get<QuizResponse>(`/quizzes/${quizId}`),

  create: (data: CreateQuizPayload) =>
    apiClient.post<QuizResponse>('/quizzes', data),

  update: (quizId: string, data: UpdateQuizPayload) =>
    apiClient.put<QuizResponse>(`/quizzes/${quizId}`, data),

  delete: (quizId: string) =>
    apiClient.delete(`/quizzes/${quizId}`),

  publish: (quizId: string) =>
    apiClient.put<QuizResponse>(`/quizzes/${quizId}/publish`),

  unpublish: (quizId: string) =>
    apiClient.put<QuizResponse>(`/quizzes/${quizId}/unpublish`),

  // Question management
  addQuestion: (quizId: string, data: CreateQuestionPayload) =>
    apiClient.post<QuestionResponse>(`/quizzes/${quizId}/questions`, data),

  updateQuestion: (quizId: string, questionId: string, data: UpdateQuestionPayload) =>
    apiClient.put<QuestionResponse>(`/quizzes/${quizId}/questions/${questionId}`, data),

  deleteQuestion: (quizId: string, questionId: string) =>
    apiClient.delete(`/quizzes/${quizId}/questions/${questionId}`),

  reorderQuestions: (quizId: string, questionIds: string[]) =>
    apiClient.put(`/quizzes/${quizId}/questions/reorder`, { questionIds }),

  // Analytics
  getAnalytics: (quizId: string) =>
    apiClient.get<QuizAnalyticsResponse>(`/quizzes/${quizId}/analytics`),

  getAttemptHistory: (quizId: string, params?: { userId?: string; page?: number }) =>
    apiClient.get<AttemptHistoryResponse>(`/quizzes/${quizId}/attempts`, { params }),
};
```

```typescript
// Types

type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'MULTI_SELECT';
type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'TIMED_OUT';

interface CreateQuizPayload {
  title: string;
  description?: string;
  timeLimitSecs?: number;
  passingScore?: number;       // percentage 0-100
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  questions?: CreateQuestionPayload[];  // optional: create quiz with questions in one call
}

interface UpdateQuizPayload {
  title?: string;
  description?: string;
  timeLimitSecs?: number | null;
  passingScore?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
}

interface CreateQuestionPayload {
  type: QuestionType;
  text: string;
  explanation?: string;
  points?: number;
  sortOrder?: number;
  options?: CreateOptionPayload[];
}

interface UpdateQuestionPayload {
  type?: QuestionType;
  text?: string;
  explanation?: string;
  points?: number;
  sortOrder?: number;
  options?: CreateOptionPayload[];  // replaces all options
}

interface CreateOptionPayload {
  text: string;
  isCorrect: boolean;
  sortOrder?: number;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  timeLimitSecs?: number;
  passingScore: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  isPublished: boolean;
  questionCount: number;       // count for list view
  questions?: Question[];      // included when fetching detail
  createdAt: string;
  updatedAt: string;
}

interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  text: string;
  explanation?: string;
  points: number;
  sortOrder: number;
  options: QuestionOption[];
  createdAt: string;
  updatedAt: string;
}

interface QuestionOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  sortOrder: number;
}

interface QuizListResponse {
  quizzes: Quiz[];
  meta: PageMeta;
}

interface QuizResponse {
  quiz: Quiz;
}

interface QuestionResponse {
  question: Question;
}

interface QuizAnalyticsResponse {
  quizId: string;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  questionStats: {
    questionId: string;
    text: string;
    correctRate: number;
    averagePoints: number;
  }[];
}

interface AttemptHistoryResponse {
  attempts: {
    id: string;
    userId: string;
    studentName: string;
    score: number;
    totalPoints: number;
    status: AttemptStatus;
    startedAt: string;
    submittedAt?: string;
  }[];
  meta: PageMeta;
}
```

### 5.3 Query Hooks

```typescript
// hooks/use-quizzes.ts

import { useApiQuery, useApiMutation } from './use-api';
import { quizApi } from '../lib/api';

export function useQuizzes(params?: { page?: number; pageSize?: number; search?: string; isPublished?: boolean }) {
  return useApiQuery(
    ['quizzes', params?.page, params?.pageSize, params?.search, params?.isPublished],
    () => quizApi.getAll(params),
  );
}

export function useQuiz(quizId: string) {
  return useApiQuery(
    ['quiz', quizId],
    () => quizApi.getById(quizId),
    { enabled: !!quizId },
  );
}

export function useCreateQuiz() {
  return useApiMutation(quizApi.create, {
    invalidateQueries: ['quizzes'],
    onSuccess: () => {
      toast.success('Quiz created successfully');
    },
  });
}

export function useUpdateQuiz() {
  return useApiMutation(
    ({ quizId, data }: { quizId: string; data: UpdateQuizPayload }) =>
      quizApi.update(quizId, data),
    {
      invalidateQueries: ['quizzes', 'quiz'],
      onSuccess: () => {
        toast.success('Quiz updated successfully');
      },
    },
  );
}

export function useDeleteQuiz() {
  return useApiMutation(quizApi.delete, {
    invalidateQueries: ['quizzes'],
    onSuccess: () => {
      toast.success('Quiz deleted');
    },
  });
}

export function usePublishQuiz() {
  return useApiMutation(quizApi.publish, {
    invalidateQueries: ['quizzes', 'quiz'],
    onSuccess: () => {
      toast.success('Quiz published');
    },
  });
}

export function useAddQuestion() {
  return useApiMutation(
    ({ quizId, data }: { quizId: string; data: CreateQuestionPayload }) =>
      quizApi.addQuestion(quizId, data),
    {
      invalidateQueries: ['quiz'],
      onSuccess: () => {
        toast.success('Question added');
      },
    },
  );
}

export function useUpdateQuestion() {
  return useApiMutation(
    ({ quizId, questionId, data }: { quizId: string; questionId: string; data: UpdateQuestionPayload }) =>
      quizApi.updateQuestion(quizId, questionId, data),
    {
      invalidateQueries: ['quiz'],
      onSuccess: () => {
        toast.success('Question updated');
      },
    },
  );
}

export function useDeleteQuestion() {
  return useApiMutation(
    ({ quizId, questionId }: { quizId: string; questionId: string }) =>
      quizApi.deleteQuestion(quizId, questionId),
    {
      invalidateQueries: ['quiz'],
      onSuccess: () => {
        toast.success('Question deleted');
      },
    },
  );
}

export function useReorderQuestions() {
  return useApiMutation(
    ({ quizId, questionIds }: { quizId: string; questionIds: string[] }) =>
      quizApi.reorderQuestions(quizId, questionIds),
    {
      invalidateQueries: ['quiz'],
    },
  );
}

export function useQuizAnalytics(quizId: string) {
  return useApiQuery(
    ['quiz-analytics', quizId],
    () => quizApi.getAnalytics(quizId),
    { enabled: !!quizId },
  );
}
```

### 5.4 Validation Schemas

```typescript
// validations/quiz.ts

import { z } from 'zod';

export const optionSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
  sortOrder: z.number().optional(),
});

export const questionSchema = z.object({
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'MULTI_SELECT']),
  text: z.string().min(1, 'Question text is required').max(2000),
  explanation: z.string().max(2000).optional().or(z.literal('')),
  points: z.number().min(1).max(100).default(1),
  options: z
    .array(optionSchema)
    .min(2, 'At least 2 options required')
    .refine(
      (options) => options.some((o) => o.isCorrect),
      'At least one option must be marked as correct'
    ),
});

export const quizSettingsSchema = z.object({
  title: z.string().min(1, 'Quiz title is required').max(255),
  description: z.string().max(2000).optional().or(z.literal('')),
  timeLimitSecs: z
    .number()
    .min(60, 'Minimum 1 minute')
    .max(7200, 'Maximum 2 hours')
    .optional()
    .nullable(),
  passingScore: z.number().min(0).max(100).default(70),
  maxAttempts: z.number().min(1).max(99).default(3),
  shuffleQuestions: z.boolean().default(false),
});

export const createQuizSchema = z.object({
  ...quizSettingsSchema.shape,
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
});

// Field-level schemas for TanStack Form validators
export const quizFieldSchemas = {
  title: quizSettingsSchema.shape.title,
  description: quizSettingsSchema.shape.description,
  passingScore: quizSettingsSchema.shape.passingScore,
  maxAttempts: quizSettingsSchema.shape.maxAttempts,
  timeLimitSecs: quizSettingsSchema.shape.timeLimitSecs,
};

export type CreateQuizFormData = z.infer<typeof createQuizSchema>;
export type QuestionFormData = z.infer<typeof questionSchema>;
export type OptionFormData = z.infer<typeof optionSchema>;
```

### 5.5 Quiz Store (Zustand)

Uses a Zustand store similar to the content creation wizard (`studio-store.ts`):

```typescript
// stores/quiz-store.ts

import { create } from 'zustand';

interface QuizFormQuestion {
  tempId: string;           // client-side temp ID for list keys
  type: QuestionType;
  text: string;
  explanation: string;
  points: number;
  options: {
    tempId: string;
    text: string;
    isCorrect: boolean;
  }[];
}

interface QuizStoreState {
  // Step tracking (2 steps: Settings → Questions)
  currentStep: number;

  // Step 1: Quiz Settings
  title: string;
  description: string;
  timeLimitSecs: number | null;
  passingScore: number;
  maxAttempts: number;
  shuffleQuestions: boolean;

  // Step 2: Questions
  questions: QuizFormQuestion[];
  activeQuestionIndex: number;

  // Validation errors
  errors: Record<string, string>;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setField: (field: string, value: unknown) => void;
  setErrors: (errors: Record<string, string>) => void;

  // Question actions
  addQuestion: () => void;
  removeQuestion: (index: number) => void;
  updateQuestion: (index: number, field: string, value: unknown) => void;
  setActiveQuestion: (index: number) => void;
  reorderQuestions: (fromIndex: number, toIndex: number) => void;

  // Option actions
  addOption: (questionIndex: number) => void;
  removeOption: (questionIndex: number, optionIndex: number) => void;
  updateOption: (questionIndex: number, optionIndex: number, field: string, value: unknown) => void;
  setCorrectOption: (questionIndex: number, optionIndex: number) => void;

  reset: () => void;
}
```

### 5.6 Quiz List Page

Accessible via the **Quizzes** sidebar item (`/dashboard/quizzes`). Shows all quizzes created by the teacher in a table layout, similar to the Studio content list.

```
┌─────────────────────────────────────────────────┐
│  Quizzes                         [+ Create Quiz]  │
├─────────────────────────────────────────────────┤
│  🔍 Search quizzes...         Filter: [All ▾]     │
├─────────────────────────────────────────────────┤
│  Title              │ Questions │ Status │ Updated │
│  Intro to React     │ 5         │ ✅ Pub │ Mar 25  │
│  Advanced Topics    │ 8         │ 📝 Dra │ Mar 24  │
│  TypeScript Basics  │ 10        │ ✅ Pub │ Mar 22  │
│  System Design      │ 6         │ 📝 Dra │ Mar 20  │
├─────────────────────────────────────────────────┤
│  ← 1 2 3 ... →                         12/page   │
└─────────────────────────────────────────────────┘
```

```typescript
// routes/(dashboard)/dashboard/quizzes.tsx

export default function QuizzesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isPublished, setIsPublished] = useState<boolean | undefined>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuizzes({ page, pageSize: 12, search, isPublished });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quizzes</h1>
        <Button onClick={() => navigate({ to: '/dashboard/quizzes/create' })}>
          <Plus className="mr-2 h-4 w-4" />
          Create Quiz
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search quizzes..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-sm"
        />
        <Select value={isPublished?.toString() ?? 'all'} onValueChange={(v) => {
          setIsPublished(v === 'all' ? undefined : v === 'true');
          setPage(1);
        }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Published</SelectItem>
            <SelectItem value="false">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <PerformaTable
        columns={quizColumns}
        data={data?.quizzes ?? []}
        meta={data?.meta}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowClick={(quiz) =>
          navigate({ to: '/dashboard/quizzes/$quizId', params: { quizId: quiz.id } })
        }
      />
    </div>
  );
}
```

### 5.7 Quiz Creation Page — 2-Step Wizard

Clicking "Create Quiz" navigates to `/dashboard/quizzes/create`.

#### Step 1: Quiz Settings

```
┌─────────────────────────────────────────────────┐
│  ← Back    Create Quiz                            │
│            Step 1 of 2: Settings                  │
├─────────────────────────────────────────────────┤
│  ● Settings  ○ Questions                          │
├─────────────────────────────────────────────────┤
│                                                   │
│  Quiz Title *                                     │
│  ┌─────────────────────────────────────────┐      │
│  │ Intro to React Native Quiz               │      │
│  └─────────────────────────────────────────┘      │
│                                                   │
│  Description (optional)                           │
│  ┌─────────────────────────────────────────┐      │
│  │ Test your understanding of React Native  │      │
│  │ fundamentals.                            │      │
│  └─────────────────────────────────────────┘      │
│                                                   │
│  ┌──────────────────┐  ┌──────────────────┐       │
│  │ Time Limit (min)  │  │ Passing Score (%) │       │
│  │ ┌──────────────┐  │  │ ┌──────────────┐  │       │
│  │ │ 10            │  │  │ │ 70            │  │       │
│  │ └──────────────┘  │  │ └──────────────┘  │       │
│  └──────────────────┘  └──────────────────┘       │
│                                                   │
│  ┌──────────────────┐  ┌──────────────────┐       │
│  │ Max Attempts      │  │ Shuffle           │       │
│  │ ┌──────────────┐  │  │ ┌──────────────┐  │       │
│  │ │ 3             │  │  │ │ ☐ Shuffle Qs  │  │       │
│  │ └──────────────┘  │  │ └──────────────┘  │       │
│  └──────────────────┘  └──────────────────┘       │
│                                                   │
│                                       [Next →]    │
└─────────────────────────────────────────────────┘
```

#### Step 2: Questions

```
┌─────────────────────────────────────────────────┐
│  ← Back    Create Quiz                            │
│            Step 2 of 2: Questions                 │
├─────────────────────────────────────────────────┤
│  ○ Settings  ● Questions                          │
├─────────────────────────────────────────────────┤
│                                                   │
│  Questions (3)                   [+ Add Question]  │
│                                                   │
│  ┌───────────────────────────────────────────┐    │
│  │ ☰  Q1  Multiple Choice          2 pts  ✕  │    │
│  │                                            │    │
│  │  Question Text *                           │    │
│  │  ┌────────────────────────────────────┐    │    │
│  │  │ What is React Native?              │    │    │
│  │  └────────────────────────────────────┘    │    │
│  │                                            │    │
│  │  Type: [Multiple Choice ▾]   Points: [2]   │    │
│  │                                            │    │
│  │  Options:                                  │    │
│  │  ┌────────────────────────────────────┐    │    │
│  │  │ ◉ A cross-platform framework       │ ✕  │    │
│  │  └────────────────────────────────────┘    │    │
│  │  ┌────────────────────────────────────┐    │    │
│  │  │ ○ A database tool                  │ ✕  │    │
│  │  └────────────────────────────────────┘    │    │
│  │  ┌────────────────────────────────────┐    │    │
│  │  │ ○ A CSS framework                  │ ✕  │    │
│  │  └────────────────────────────────────┘    │    │
│  │  ┌────────────────────────────────────┐    │    │
│  │  │ ○ A testing library                │ ✕  │    │
│  │  └────────────────────────────────────┘    │    │
│  │  [+ Add Option]                            │    │
│  │                                            │    │
│  │  Explanation (shown after attempt):        │    │
│  │  ┌────────────────────────────────────┐    │    │
│  │  │ React Native is a framework by...  │    │    │
│  │  └────────────────────────────────────┘    │    │
│  └───────────────────────────────────────────┘    │
│                                                   │
│  ┌───────────────────────────────────────────┐    │
│  │ ☰  Q2  True / False             1 pt   ✕  │    │
│  │  ...                                       │    │
│  └───────────────────────────────────────────┘    │
│                                                   │
│  ┌───────────────────────────────────────────┐    │
│  │ ☰  Q3  Multiple Choice          1 pt   ✕  │    │
│  │  ...                                       │    │
│  └───────────────────────────────────────────┘    │
│                                                   │
│                         [← Back]  [Save as Draft] │
│                                   [Create & Publish] │
└─────────────────────────────────────────────────┘
```

### 5.8 Question Type Behaviors

| Type | Options | Correct Answer |
|------|---------|---------------|
| **MULTIPLE_CHOICE** | 2-6 options, radio select | Exactly 1 correct |
| **TRUE_FALSE** | Auto-generated: "True" + "False" | 1 correct |
| **SHORT_ANSWER** | No options shown | Teacher enters expected answer text |
| **MULTI_SELECT** | 2-6 options, checkbox select | 1 or more correct |

When changing question type:
- **→ TRUE_FALSE**: Auto-set options to `[{text: "True"}, {text: "False"}]`, lock option editing
- **→ SHORT_ANSWER**: Hide options panel, show "Expected answer" textarea
- **→ MULTIPLE_CHOICE / MULTI_SELECT**: Show editable options list

### 5.9 Quiz Edit Page

Navigating to `/dashboard/quizzes/:quizId` loads the quiz with all questions and reuses the same 2-step wizard form, pre-populated with existing data.

```typescript
// routes/(dashboard)/dashboard/quizzes_.$quizId.tsx

export default function EditQuizPage() {
  const { quizId } = useParams();
  const { data, isLoading } = useQuiz(quizId);
  const { mutate: updateQuiz, isPending: isUpdating } = useUpdateQuiz();
  const { mutate: publishQuiz } = usePublishQuiz();
  const store = useQuizStore();

  // Pre-populate store on data load
  useEffect(() => {
    if (data?.quiz) {
      store.setField('title', data.quiz.title);
      store.setField('description', data.quiz.description ?? '');
      store.setField('timeLimitSecs', data.quiz.timeLimitSecs ?? null);
      store.setField('passingScore', data.quiz.passingScore);
      store.setField('maxAttempts', data.quiz.maxAttempts);
      store.setField('shuffleQuestions', data.quiz.shuffleQuestions);
      // Map server questions → store format with tempIds
      // ...
    }
  }, [data]);

  const handleSave = () => {
    // Validate → updateQuiz → redirect or show success
  };

  const handlePublish = () => {
    publishQuiz(quizId, {
      onSuccess: () => navigate({ to: '/dashboard/quizzes' }),
    });
  };

  // Renders same QuizWizard component as create page
}
```

### 5.10 Quiz Analytics Dialog

From the quiz list or quiz detail page, clicking "Analytics" opens a dialog:

```
┌─────────────────────────────────────────────────┐
│  Analytics: Intro to React Native Quiz           │
├─────────────────────────────────────────────────┤
│                                                   │
│  Total Attempts: 45    Average Score: 78%         │
│  Pass Rate: 82%                                   │
│                                                   │
│  Question Difficulty                              │
│  ┌───────────────────────────────────────────┐    │
│  │ Q1: What is React Native?     ████████ 92%│    │
│  │ Q2: JSX is...                 ██████░░ 74%│    │
│  │ Q3: State vs Props            █████░░░ 61%│    │
│  │ Q4: useEffect lifecycle       ███░░░░░ 38%│    │
│  │ Q5: Navigation patterns       ██████░░ 71%│    │
│  └───────────────────────────────────────────┘    │
│                                                   │
│  Recent Attempts                                  │
│  ┌───────────────────────────────────────────┐    │
│  │ John Doe     85%  GRADED    Mar 25 10:30  │    │
│  │ Jane Smith   92%  GRADED    Mar 25 09:15  │    │
│  │ Bob Wilson   60%  GRADED    Mar 24 14:00  │    │
│  └───────────────────────────────────────────┘    │
│                                                   │
│                                       [Close]     │
└─────────────────────────────────────────────────┘
```

### 5.11 Quiz Creation Flow

```
Teacher clicks "Quizzes" in sidebar → /dashboard/quizzes
  ↓
Sees quiz list (table with search, filter by status)
  ↓
Clicks "+ Create Quiz" → /dashboard/quizzes/create
  ↓
Step 1: Fills quiz settings (title, description, time limit, etc.)
  ↓
Zod validates step 1 → errors shown inline if invalid
  ↓
Clicks "Next →" → moves to step 2
  ↓
Adds questions one by one:
  - Selects question type
  - Writes question text
  - Adds options (for MC/TF/MS) or expected answer (for SA)
  - Marks correct option(s)
  - Sets points & optional explanation
  - Can reorder via drag handle
  ↓
Clicks "Create & Publish" or "Save as Draft"
  ↓
POST /api/v1/quizzes
  {
    title, description,
    timeLimitSecs, passingScore, maxAttempts, shuffleQuestions,
    questions: [
      { type, text, explanation, points, options: [{ text, isCorrect }] },
      ...
    ]
  }
  ↓
onSuccess:
  1. Toast: "Quiz created successfully"
  2. Invalidate ['quizzes'] query
  3. Navigate to /dashboard/quizzes
  ↓
If "Create & Publish" was clicked:
  PUT /api/v1/quizzes/:quizId/publish
  ↓
Quiz appears in quiz list with Published badge
```

---

## 6. Navigation Map

### performa-studio (Teacher)

```
/login
  ↓ (authenticate)
/dashboard
  ├── /studio                         ← Content list (videos/documents)
  │   ├── /studio/create              ← Create content (4-step wizard)
  │   └── /studio/:contentId          ← Content detail (Sections | Assigned Students)
  ├── /quizzes                        ← Quiz list (table)                    ← NEW
  │   ├── /quizzes/create             ← Create quiz (2-step wizard)          ← NEW
  │   └── /quizzes/:quizId            ← Quiz detail / edit                   ← NEW
  ├── /students                       ← Student list
  │   ├── /students/create            ← Create student
  │   └── /students/:id              ← Student detail
  │       └── Assignments tab         ← Student's assignments
  ├── /assignments                    ← Teacher assignment overview
  ├── /analytics
  └── /settings
```

---

## 7. Implementation Order

| Step | Project | Task |
|------|---------|------|
| **1** | performa-edu | Add Quiz models to Prisma schema (Quiz, Question, QuestionOption, QuizAttempt, AttemptAnswer) |
| **2** | performa-edu | Create `quiz-service` gRPC microservice (NestJS module, controller, service, repository) |
| **3** | performa-edu | Add `quiz-service.proto` with gRPC service definition |
| **4** | performa-edu | Wire quiz-service into API gateway (QuizController, routes) |
| **5** | performa-edu | Add quiz-service to docker-compose.yml (port 50055) |
| **6** | performa-studio | Add `quizApi` to API layer (`lib/api.ts`) |
| **7** | performa-studio | Add `useQuizzes` hooks (`hooks/use-quizzes.ts`) |
| **8** | performa-studio | Add quiz validation schemas (`validations/quiz.ts`) |
| **9** | performa-studio | Add quiz Zustand store (`stores/quiz-store.ts`) |
| **10** | performa-studio | Add "Quizzes" sidebar item + quiz list page (`/dashboard/quizzes`) |
| **11** | performa-studio | Add quiz creation page (2-step wizard: Settings → Questions) |
| **12** | performa-studio | Add quiz detail/edit page (reuse wizard components) |
| **13** | performa-studio | Add quiz analytics dialog |
