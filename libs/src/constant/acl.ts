export enum AclAction {
  MANAGE = 'manage',
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
}

export enum AclSubject {
  ALL = 'All',
  USER = 'User',
  ROLE = 'Role',
  ATTENDANCE = 'Attendance',
  ACADEMIC_YEAR = 'AcademicYear',
  SUBJECTS = 'Subjects',
  CLASS = 'Class',
  STUDENT = 'Student',
  TEACHER = 'Teacher',
  ADMIN = 'Admin',
  EXAM = 'Exam',
  ASSIGNMENT = 'Assignment',
  GRADE = 'Grade',
  REPORT = 'Report',
}

export type Permissions = Record<AclSubject, AclAction>;
