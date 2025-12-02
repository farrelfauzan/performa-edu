import { type AclAction, type AclSubject } from '../constant';

type AclActionKeys = keyof typeof AclAction;
export type AclActionValues = (typeof AclAction)[AclActionKeys];

type AclSubjectKeys = keyof typeof AclSubject;
export type AclSubjectValues = (typeof AclSubject)[AclSubjectKeys];
