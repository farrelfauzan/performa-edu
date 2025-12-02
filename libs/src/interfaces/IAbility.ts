import { type AclActionValues, type AclSubjectValues } from '../types';

export interface IAbility {
  action: AclActionValues;
  subject: AclSubjectValues;
  condition?: unknown;
}
