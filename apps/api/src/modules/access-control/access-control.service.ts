import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from './role.entity';
import { Permission } from './permission.entity';
import { Role, UserProfile } from '@sllas/contracts';

@Injectable()
export class AccessControlService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async getRolePermissions(role: Role): Promise<string[]> {
    const roleEntity = await this.roleRepo.findOne({
      where: { name: role },
      relations: ['permissions'],
    });

    if (!roleEntity || !roleEntity.permissions) {
      return [];
    }

    return roleEntity.permissions.map(p => p.code);
  }

  /**
   * Check if user is authorized to act on a record within a given jurisdiction
   */
  hasJurisdiction(user: UserProfile, resourceProvinceId?: string | null, resourceDistrictId?: string | null): boolean {
    // Admins and Auditors have nationwide jurisdiction
    if (user.role === Role.SYSTEM_ADMIN || user.role === Role.AUDITOR) {
      return true;
    }

    // National office staff have nationwide jurisdiction
    if (!user.provinceId && !user.districtId) {
      return true;
    }

    // If resource is in a specific province, officer's province must match
    if (resourceProvinceId && user.provinceId && user.provinceId !== resourceProvinceId) {
      return false;
    }

    // If officer is district-scoped, district must match
    if (resourceDistrictId && user.districtId && user.districtId !== resourceDistrictId) {
      return false;
    }

    return true;
  }
}
