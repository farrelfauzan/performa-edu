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
  DEPARTMENT = 'Department',
  POSITION = 'Position',
  ROLE = 'Role',
  COMPANY = 'Company',
  EMPLOYEE = 'Employee',
  ATTENDANCE = 'Attendance',
  LEAVE = 'Leave',
}

export type Permissions = Record<AclSubject, AclAction>;
