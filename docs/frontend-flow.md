# Frontend Flow — Student Management, Assignment & Quiz

> **Branch**: `revamp-v2`
> **Date**: 2026-03-22
> **Depends on**: [student-service-approach.md](./student-service-approach.md), [quiz-service-approach.md](./quiz-service-approach.md)

---

## 1. Overview

This document covers the full frontend implementation for three flows:

1. **Teacher registers a student** (performa-studio)
2. **Teacher assigns content/quiz to student** (performa-studio)
3. **Student works on quiz** (performa-app)

---

## 2. Tech Stack Reference

| | performa-studio (Teacher) | performa-app (Student) |
|---|---|---|
| **Framework** | React 19 + Vite | React Native + Expo |
| **Routing** | TanStack Router (file-based) | Expo Router (file-based) |
| **Data Fetching** | TanStack Query + Axios | TanStack Query + Axios (to add) |
| **State** | Zustand (auth + forms) | Zustand (auth, to add) |
| **Forms** | Zustand store + Zod validation | React state + Zod |
| **UI** | Shadcn/UI (Radix + Tailwind) | Custom components + Tailwind (Uniwind) |

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

## 5. Flow 3 — Student Works on Quiz (performa-app)

### 5.1 Prerequisites — API Client Setup

The mobile app currently uses mock data. Before implementing quiz flow, add:

```typescript
// utils/api-client.ts

import axios from 'axios';
import { useAuthStore } from '../stores/auth-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error.response?.data || error);
  }
);
```

```typescript
// stores/auth-store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  accessToken: string | null;
  user: SessionUser | null;
  setAuth: (token: string, user: SessionUser) => void;
  setUser: (user: SessionUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### 5.2 New Routes (Expo Router)

```
app/
├── (auth)/
│   ├── _layout.tsx            ← Auth layout (no tab bar)
│   └── login.tsx              ← Login screen
├── (tabs)/
│   ├── _layout.tsx            ← Tab bar layout
│   ├── index.tsx              ← Home (assigned content list)
│   ├── courses.tsx            ← All assigned content (grid)
│   ├── explore.tsx            ← Video reels
│   └── profile.tsx            ← Student profile
├── content/
│   ├── [id].tsx               ← Content detail (sections list)
│   └── section/
│       └── [sectionId].tsx    ← Section player (video/document)
├── quiz/
│   ├── [contentId].tsx        ← Quiz intro screen
│   └── [contentId]/
│       └── play.tsx           ← Quiz question-by-question
└── _layout.tsx                ← Root layout (auth check)
```

### 5.3 API Layer (Mobile)

```typescript
// utils/api.ts

export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  getMe: () => apiClient.get('/auth/getMe'),
};

export const assignmentApi = {
  // Student: my assignments
  getMy: (params?: { status?: string; page?: number; pageSize?: number }) =>
    apiClient.get<AssignmentListResponse>('/assignments/my', { params }),

  // Student: update progress
  updateProgress: (data: UpdateProgressPayload) =>
    apiClient.put<UpdateProgressResponse>('/assignments/progress', data),

  // Student: view progress detail
  getProgressLogs: (studentId: string, contentId: string) =>
    apiClient.get<ProgressLogsResponse>(`/assignments/${studentId}/${contentId}/progress`),
};

export const contentApi = {
  getById: (id: string) =>
    apiClient.get<ContentResponse>(`/contents/${id}`),
};
```

```typescript
// Types

interface UpdateProgressPayload {
  contentId: string;
  action: 'COMPLETE_SECTION' | 'ANSWER_QUESTION';
  sectionId?: string;
  questionId?: string;
}

interface UpdateProgressResponse {
  assignment: Assignment;
  alreadyLogged: boolean;
}
```

### 5.4 Home Screen — My Assignments

Replace current mock data with real assigned content:

```
┌──────────────────────────────────┐
│  👋 Hi, John                     │
│  You have 3 assigned courses     │
├──────────────────────────────────┤
│                                    │
│  Continue Learning                 │
│  ┌────────────────────────────┐    │
│  │ 📘 React Native Fund...  │    │
│  │ ██████░░░░ 60%            │    │
│  │ Due Apr 15                │    │
│  └────────────────────────────┘    │
│                                    │
│  New Assignments                   │
│  ┌────────┐  ┌────────┐           │
│  │TS Adv  │  │Design  │           │
│  │0%      │  │0%      │           │
│  │May 01  │  │May 15  │           │
│  └────────┘  └────────┘           │
│                                    │
│  Completed ✅                     │
│  ┌────────────────────────────┐    │
│  │ 📗 System Design Basics   │    │
│  │ ██████████ 100%  ✅       │    │
│  └────────────────────────────┘    │
│                                    │
└──────────────────────────────────┘
    🏠     📚     🎬     👤
```

```typescript
// hooks/use-assignments.ts (mobile)

export function useMyAssignments(params?: { status?: string }) {
  return useQuery({
    queryKey: ['my-assignments', params],
    queryFn: () => assignmentApi.getMy(params),
  });
}
```

### 5.5 Content Detail Screen

Student taps on an assignment → opens content detail:

```
┌──────────────────────────────────┐
│  ←  React Native Fundamentals    │
│  ██████░░░░ 60%  •  6/10 done   │
├──────────────────────────────────┤
│                                    │
│  ┌────────────────────────────┐    │
│  │  🎬  Preview Video         │    │
│  │  ▶ (thumbnail)             │    │
│  └────────────────────────────┘    │
│                                    │
│  Sections                          │
│                                    │
│  ✅ 1. Introduction                │
│     └─ 2 videos  •  Completed     │
│                                    │
│  ✅ 2. Core Concepts               │
│     └─ 3 videos  •  Completed     │
│                                    │
│  🔵 3. Advanced Topics            │
│     └─ 4 videos  •  Completed     │
│     └─ 📝 Quiz (3/5 answered)    │
│                                    │
│  ⬜ 4. Deployment                  │
│     └─ 3 videos  •  Not started   │
│     └─ 📝 Quiz (not started)     │
│                                    │
└──────────────────────────────────┘
```

Tapping a section opens the section player. Tapping a quiz opens the quiz screen.

### 5.6 Quiz Intro Screen

```
┌──────────────────────────────────┐
│  ←  Quiz: Advanced Topics        │
├──────────────────────────────────┤
│                                    │
│           📝                       │
│                                    │
│     Advanced Topics Quiz           │
│                                    │
│     5 Questions                    │
│     ~10 minutes                    │
│                                    │
│     Progress: 3/5 answered         │
│     ███████░░░ 60%                │
│                                    │
│     ⚠️ You can resume where        │
│     you left off.                  │
│                                    │
│     ┌────────────────────────┐     │
│     │      Start Quiz        │     │
│     └────────────────────────┘     │
│                                    │
│     ┌────────────────────────┐     │
│     │    Review Answers      │     │
│     └────────────────────────┘     │
│                                    │
└──────────────────────────────────┘
```

### 5.7 Quiz Play Screen — Question by Question

```
┌──────────────────────────────────┐
│  ←  Question 4 of 5     ⏱ 3:42  │
│  ████████░░ 80%                  │
├──────────────────────────────────┤
│                                    │
│  What is the purpose of           │
│  useEffect in React?              │
│                                    │
│  ┌────────────────────────────┐    │
│  │ ○ To manage component      │    │
│  │   state                    │    │
│  └────────────────────────────┘    │
│  ┌────────────────────────────┐    │
│  │ ● To perform side effects  │    │  ← selected
│  │   after render             │    │
│  └────────────────────────────┘    │
│  ┌────────────────────────────┐    │
│  │ ○ To create new components │    │
│  └────────────────────────────┘    │
│  ┌────────────────────────────┐    │
│  │ ○ To define routes         │    │
│  └────────────────────────────┘    │
│                                    │
│  ┌────────────────────────────┐    │
│  │        Next →              │    │
│  └────────────────────────────┘    │
│                                    │
└──────────────────────────────────┘
```

### 5.8 Quiz State Management

```typescript
// stores/quiz-store.ts

import { create } from 'zustand';

interface QuizState {
  contentId: string;
  sectionId: string;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, string>;        // questionId → selectedOptionId
  answeredQuestionIds: Set<string>;       // already sent to server
  isSubmitting: boolean;

  // Actions
  loadQuiz: (contentId: string, sectionId: string, questions: QuizQuestion[]) => void;
  selectAnswer: (questionId: string, optionId: string) => void;
  markAnswered: (questionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  contentId: '',
  sectionId: '',
  questions: [],
  currentIndex: 0,
  answers: {},
  answeredQuestionIds: new Set(),
  isSubmitting: false,

  loadQuiz: (contentId, sectionId, questions) =>
    set({ contentId, sectionId, questions, currentIndex: 0, answers: {}, answeredQuestionIds: new Set() }),

  selectAnswer: (questionId, optionId) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: optionId } })),

  markAnswered: (questionId) =>
    set((state) => ({
      answeredQuestionIds: new Set([...state.answeredQuestionIds, questionId]),
    })),

  nextQuestion: () =>
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
    })),

  prevQuestion: () =>
    set((state) => ({
      currentIndex: Math.max(state.currentIndex - 1, 0),
    })),

  goToQuestion: (index) => set({ currentIndex: index }),

  reset: () =>
    set({ contentId: '', sectionId: '', questions: [], currentIndex: 0, answers: {}, answeredQuestionIds: new Set() }),
}));
```

### 5.9 Quiz Play Screen Implementation

```typescript
// app/quiz/[contentId]/play.tsx

export default function QuizPlayScreen() {
  const { contentId } = useLocalSearchParams<{ contentId: string }>();
  const store = useQuizStore();
  const { mutate: updateProgress } = useUpdateProgress();

  const question = store.questions[store.currentIndex];
  const selectedOption = store.answers[question?.id];
  const isAlreadyAnswered = store.answeredQuestionIds.has(question?.id);

  const handleNext = () => {
    // If student selected an answer and hasn't submitted it yet → send to server
    if (selectedOption && !isAlreadyAnswered) {
      updateProgress(
        {
          contentId: store.contentId,
          action: 'ANSWER_QUESTION',
          questionId: question.id,
        },
        {
          onSuccess: (data) => {
            store.markAnswered(question.id);
            // Progress auto-updates from server response
          },
        }
      );
    }

    // Move to next question (or finish)
    if (store.currentIndex < store.questions.length - 1) {
      store.nextQuestion();
    } else {
      // Last question → navigate to results
      router.replace(`/quiz/${contentId}/results`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      {/* Header: question number + progress bar */}
      <View className="px-4 pt-4">
        <Text className="text-white/60 font-[Poppins_400Regular]">
          Question {store.currentIndex + 1} of {store.questions.length}
        </Text>
        <View className="mt-2 h-2 rounded-full bg-white/10">
          <View
            className="h-2 rounded-full bg-blue-400"
            style={{ width: `${((store.currentIndex + 1) / store.questions.length) * 100}%` }}
          />
        </View>
      </View>

      {/* Question text */}
      <View className="flex-1 px-4 pt-8">
        <Text className="text-xl text-white font-[Poppins_600SemiBold] mb-6">
          {question?.text}
        </Text>

        {/* Options */}
        {question?.options.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => !isAlreadyAnswered && store.selectAnswer(question.id, option.id)}
            className={`mb-3 rounded-xl border-2 p-4 ${
              selectedOption === option.id
                ? 'border-blue-400 bg-blue-400/10'
                : 'border-white/10 bg-white/5'
            } ${isAlreadyAnswered ? 'opacity-60' : ''}`}
          >
            <Text className="text-white font-[Poppins_400Regular]">
              {option.text}
            </Text>
          </Pressable>
        ))}

        {isAlreadyAnswered && (
          <Text className="text-green-400 text-sm font-[Poppins_400Regular] mt-2">
            ✅ Answer submitted
          </Text>
        )}
      </View>

      {/* Navigation */}
      <View className="flex-row justify-between px-4 pb-6">
        <Pressable
          onPress={store.prevQuestion}
          disabled={store.currentIndex === 0}
          className={`rounded-xl px-6 py-3 ${store.currentIndex === 0 ? 'opacity-30' : 'bg-white/10'}`}
        >
          <Text className="text-white font-[Poppins_600SemiBold]">← Back</Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          disabled={!selectedOption}
          className={`rounded-xl px-6 py-3 ${selectedOption ? 'bg-blue-500' : 'bg-white/10 opacity-30'}`}
        >
          <Text className="text-white font-[Poppins_600SemiBold]">
            {store.currentIndex === store.questions.length - 1 ? 'Finish' : 'Next →'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

### 5.10 Progress Update Hook

```typescript
// hooks/use-progress.ts

export function useUpdateProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignmentApi.updateProgress,
    onSuccess: (data) => {
      // Update assignment cache with new progress
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
    },
  });
}
```

### 5.11 Complete Quiz Flow

```
Student opens app → sees assigned content list (Home)
  ↓
Taps "React Native Fundamentals" → Content Detail screen
  ↓
Sees sections list with progress indicators
  ↓
Taps "📝 Quiz: Advanced Topics" → Quiz Intro screen
  ↓
Sees: 5 questions, 3/5 already answered (can resume)
  ↓
Taps "Start Quiz" → Quiz Play screen (starts at Q4, the next unanswered)
  ↓
Reads Q4 → selects an option → taps "Next"
  ↓
PUT /api/v1/assignments/progress
  { contentId, action: "ANSWER_QUESTION", questionId: "q4_id" }
  ↓
Server:
  1. Creates ProgressLog entry
  2. Counts: 7/10 items completed → progress = 70%
  3. Updates assignment (status: IN_PROGRESS, progress: 70)
  4. Returns { assignment, alreadyLogged: false }
  ↓
Student sees Q5 → selects option → taps "Finish"
  ↓
PUT /api/v1/assignments/progress
  { contentId, action: "ANSWER_QUESTION", questionId: "q5_id" }
  ↓
Server:
  1. Creates ProgressLog entry
  2. Counts: 8/10 items → progress = 80%
  3. Returns updated assignment
  ↓
Quiz results screen shows: 5/5 questions answered
  ↓
Student goes back to content detail → sees updated progress bar
  ↓
Remaining items: Section 4 + Quiz Q6
Once all done → assignment.status = COMPLETED (100%)
```

### 5.12 Section Completion (Video/Document)

When a student finishes watching a section's video or reads a document:

```typescript
// app/content/section/[sectionId].tsx

// Called when video finishes or student scrolls to end of document
const handleSectionComplete = () => {
  updateProgress({
    contentId,
    action: 'COMPLETE_SECTION',
    sectionId,
  });
};

// For video: listen to onEnd event
<Video onEnd={handleSectionComplete} />

// For document: detect scroll to bottom
<ScrollView onScroll={handleDocumentScroll}>
  {/* document content */}
</ScrollView>
```

---

## 6. Navigation Map

### performa-studio (Teacher)

```
/login
  ↓ (authenticate)
/dashboard
  ├── /studio                    ← Content list
  │   ├── /studio/create         ← Create content
  │   └── /studio/:id            ← Content detail + [Assign to Students]
  ├── /students                  ← Student list        ← NEW
  │   ├── /students/create       ← Create student      ← NEW
  │   └── /students/:id          ← Student detail       ← NEW
  │       └── Assignments tab    ← Student's assignments
  ├── /assignments               ← Teacher overview     ← NEW
  ├── /analytics
  └── /settings
```

### performa-app (Student)

```
/login
  ↓ (authenticate with credentials from teacher)
/(tabs)
  ├── / (home)                   ← My assignments (continue learning, new, completed)
  ├── /courses                   ← All assignments in grid
  ├── /explore                   ← Video reels
  └── /profile                   ← Student profile + stats
/content/[id]                    ← Content detail (sections + quiz links)
/content/section/[sectionId]     ← Section player (video/document)
/quiz/[contentId]                ← Quiz intro
/quiz/[contentId]/play           ← Quiz question-by-question
/quiz/[contentId]/results        ← Quiz results summary
```

---

## 7. Implementation Order

| Step | Project | Task |
|------|---------|------|
| **1** | performa-app | Add auth store (Zustand + AsyncStorage persist) |
| **2** | performa-app | Add API client (Axios + interceptors) |
| **3** | performa-app | Add TanStack Query provider |
| **4** | performa-app | Add login screen |
| **5** | performa-studio | Add `/students` routes + pages (list, create, detail) |
| **6** | performa-studio | Add `studentApi` + hooks (`useStudents`, `useCreateStudent`) |
| **7** | performa-studio | Add `AssignContentSheet` component to content detail |
| **8** | performa-studio | Add `assignmentApi` + hooks |
| **9** | performa-studio | Add student detail page with assignments tab |
| **10** | performa-app | Replace mock data: Home → `useMyAssignments()` |
| **11** | performa-app | Add content detail screen (`/content/[id]`) |
| **12** | performa-app | Add section player screen |
| **13** | performa-app | Add progress tracking (`COMPLETE_SECTION` on video end) |
| **14** | performa-app | Add quiz intro screen |
| **15** | performa-app | Add quiz play screen with `useQuizStore` |
| **16** | performa-app | Add progress tracking (`ANSWER_QUESTION` on each answer) |
| **17** | performa-app | Add quiz results screen |
