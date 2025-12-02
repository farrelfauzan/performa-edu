import {
  createMongoAbility,
  ForbiddenError,
  type ForcedSubject,
  type MongoAbility,
  type RawRuleOf,
} from '@casl/ability';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { flatMap, map } from 'lodash';

import { PERMISSION_CHECKER_KEY } from '../decorators';
import { type IAbility } from '../interfaces';
import { Role } from '../prisma/generated/prisma-client';
import { type AclActionValues, type AclSubjectValues } from '../types';
import { AclSubject } from '../constant';

export type Abilities = [
  AclActionValues,
  AclSubjectValues | ForcedSubject<Exclude<AclSubjectValues, 'all'>>
];

export type AppAbility = MongoAbility<Abilities>;

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  createAbility = (rules: Array<RawRuleOf<AppAbility>>) =>
    createMongoAbility<AppAbility>(rules);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rules: any = this.reflector.get<IAbility[]>(
      PERMISSION_CHECKER_KEY,
      context.getHandler()
    );

    const currentUser = context.switchToHttp().getRequest().user;

    const roles: Role = currentUser?.roles || [];

    const permissions: IAbility[] = flatMap(roles, 'permissions');

    const parsedUserPermissions = this.parseCondition(permissions);

    try {
      const ability = this.createAbility(Object(parsedUserPermissions));

      if (ability.rules[0]?.subject === AclSubject.ALL) {
        return true;
      }

      for await (const rule of rules) {
        ForbiddenError.from(ability)
          .setMessage('You are not allowed to perform this action')
          .throwUnlessCan(rule.action, rule.subject);
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw new ForbiddenException(error.message);
      }

      throw error;
    }
  }

  parseCondition(
    permissions: any
    // currentUser: User
  ) {
    const data = map(
      permissions,
      (permission) =>
        // if (size(permission.conditions)) {
        //   const parsedVal = Mustache.render(
        //     permission.conditions.created_by,
        //     currentUser,
        //   );

        //   return {
        //     ...permission,
        //     conditions: { created_by: Number(parsedVal) },
        //   };
        // }

        permission
    );

    return data;
  }

  // async getSubjectById(id: number, subName: string) {
  //   const subject = await this.prisma[subName].findUnique({
  //     where: {
  //       id,
  //     },
  //   });

  //   if (!subject) {
  //     throw new NotFoundException(`${subName} not found`);
  //   }

  //   return subject;
  // }
}
