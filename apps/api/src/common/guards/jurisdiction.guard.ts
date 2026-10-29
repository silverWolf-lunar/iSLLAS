import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@sllas/contracts';
import { JURISDICTION_CHECK_KEY, JurisdictionCheckOptions } from '../decorators/jurisdiction.decorator';

@Injectable()
export class JurisdictionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<JurisdictionCheckOptions>(
      JURISDICTION_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no jurisdiction constraint is attached to endpoint, allow
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    // System Admins and Auditors have nationwide jurisdiction
    if (user.role === Role.SYSTEM_ADMIN || user.role === Role.AUDITOR) {
      return true;
    }

    // For Registry Officers and Approvers, verify jurisdiction match
    if (user.role === Role.REGISTRY_OFFICER || user.role === Role.APPROVER) {
      // If user is attached to National Office (no province restriction), allow
      if (!user.provinceId && !user.districtId) {
        return true;
      }

      // Extract target province/district from request
      const source = options.source || 'body';
      const targetContainer = source === 'params' ? request.params : source === 'query' ? request.query : request.body;

      const targetProvinceId = targetContainer?.[options.provinceField || 'provinceId'];
      const targetDistrictId = targetContainer?.[options.districtField || 'districtId'];

      // If target province is specified and does not match officer province
      if (targetProvinceId && user.provinceId && targetProvinceId !== user.provinceId) {
        throw new ForbiddenException(
          `Cross-jurisdiction access denied: User belongs to province ${user.provinceId} but resource belongs to province ${targetProvinceId}`,
        );
      }

      // If officer is district-scoped and target district does not match
      if (targetDistrictId && user.districtId && targetDistrictId !== user.districtId) {
        throw new ForbiddenException(
          `Cross-jurisdiction access denied: User is scoped to district ${user.districtId} but resource is in district ${targetDistrictId}`,
        );
      }
    }

    return true;
  }
}
