import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, UserStatus, UserProfile, AuditAction } from '@sllas/contracts';
import { CreateUserInput, UpdateUserInput } from '@sllas/validation';
import { User } from './user.entity';
import { UserIdentity } from './user-identity.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserIdentity)
    private readonly userIdentityRepo: Repository<UserIdentity>,
    private readonly auditService: AuditService,
  ) {}

  async list(filters: { role?: Role; status?: UserStatus; provinceId?: string; search?: string } = {}): Promise<User[]> {
    const qb = this.userRepo.createQueryBuilder('user').orderBy('user.createdAt', 'DESC');

    if (filters.role) {
      qb.andWhere('user.role = :role', { role: filters.role });
    }
    if (filters.status) {
      qb.andWhere('user.status = :status', { status: filters.status });
    }
    if (filters.provinceId) {
      qb.andWhere('user.provinceId = :pId', { pId: filters.provinceId });
    }
    if (filters.search) {
      qb.andWhere(
        '(LOWER(user.email) LIKE :s OR LOWER(user.firstName) LIKE :s OR LOWER(user.lastName) LIKE :s)',
        { s: `%${filters.search.toLowerCase()}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserInput, actor: UserProfile): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException(`User with email ${dto.email} already exists`);
    }

    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      status: UserStatus.ACTIVE,
      phoneNumber: dto.phoneNumber || null,
      officeId: dto.officeId || null,
      provinceId: dto.provinceId || null,
      districtId: dto.districtId || null,
    });

    const saved = await this.userRepo.save(user);

    // Link keycloak dev identity
    const identity = this.userIdentityRepo.create({
      userId: saved.id,
      provider: 'keycloak',
      providerSubject: `sub-${saved.id}`,
    });
    await this.userIdentityRepo.save(identity);

    await this.auditService.logEvent({
      action: AuditAction.CREATE,
      entityType: 'USER',
      entityId: saved.id,
      actorId: actor.id,
      actorRole: actor.role,
      provinceId: saved.provinceId,
      metadata: { role: saved.role, email: saved.email },
    });

    return saved;
  }

  async update(id: string, dto: UpdateUserInput, actor: UserProfile): Promise<User> {
    const user = await this.findOne(id);

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.status !== undefined) user.status = dto.status;
    if (dto.phoneNumber !== undefined) user.phoneNumber = dto.phoneNumber || null;
    if (dto.officeId !== undefined) user.officeId = dto.officeId || null;
    if (dto.provinceId !== undefined) user.provinceId = dto.provinceId || null;
    if (dto.districtId !== undefined) user.districtId = dto.districtId || null;

    const saved = await this.userRepo.save(user);

    await this.auditService.logEvent({
      action: AuditAction.UPDATE,
      entityType: 'USER',
      entityId: saved.id,
      actorId: actor.id,
      actorRole: actor.role,
      provinceId: saved.provinceId,
      metadata: { updatedFields: Object.keys(dto) },
    });

    return saved;
  }

  async remove(id: string, actor: UserProfile): Promise<{ success: boolean; id: string }> {
    const user = await this.findOne(id);

    try {
      // Remove any linked identities
      await this.userIdentityRepo.delete({ userId: id });
      // Delete the user record
      await this.userRepo.delete(id);
    } catch (err) {
      // If foreign keys prevent hard delete (e.g., historical applications or leases),
      // gracefully deactivate the user to maintain referential integrity
      user.status = UserStatus.DEACTIVATED;
      await this.userRepo.save(user);
    }

    await this.auditService.logEvent({
      action: AuditAction.DELETE,
      entityType: 'USER',
      entityId: id,
      actorId: actor.id,
      actorRole: actor.role,
      provinceId: user.provinceId,
      metadata: { deletedEmail: user.email, deletedRole: user.role },
    });

    return { success: true, id };
  }
}

