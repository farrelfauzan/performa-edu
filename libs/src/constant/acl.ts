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
  CUSTOMER = 'Customer',
}

export type Permissions = Record<AclSubject, AclAction>;
