import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OfficeLevel } from '@sllas/contracts';

@Entity('organizations')
export class Office {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: OfficeLevel,
    default: OfficeLevel.PROVINCIAL,
  })
  @Index('idx_offices_level')
  level: OfficeLevel;

  @Column({ name: 'province_id', type: 'uuid', nullable: true })
  @Index('idx_offices_province')
  provinceId: string | null;

  @Column({ name: 'district_id', type: 'uuid', nullable: true })
  @Index('idx_offices_district')
  districtId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ name: 'phone_number', type: 'varchar', length: 50, nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
