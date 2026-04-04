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
  ADMIN = 'Admin',
  TEACHER = 'Teacher',
  CONTENT = 'Content',
  STUDENT = 'Student',
  ASSIGNMENT = 'Assignment',
  QUIZ = 'Quiz',
  CLASS = 'Class',
  BRANCH = 'Branch',
}

export type Permissions = Record<AclSubject, AclAction>;
