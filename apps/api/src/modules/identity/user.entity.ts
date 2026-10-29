import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Role, UserStatus } from '@sllas/contracts';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_users_email')
  email: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 50, nullable: true })
  phoneNumber: string | null;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CLIENT,
  })
  @Index('idx_users_role')
  role: Role;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  @Index('idx_users_status')
  status: UserStatus;

  @Column({ name: 'office_id', type: 'uuid', nullable: true })
  @Index('idx_users_office_id')
  officeId: string | null;

  @Column({ name: 'province_id', type: 'uuid', nullable: true })
  @Index('idx_users_province_id')
  provinceId: string | null;

  @Column({ name: 'district_id', type: 'uuid', nullable: true })
  @Index('idx_users_district_id')
  districtId: string | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
