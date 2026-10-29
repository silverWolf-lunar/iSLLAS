import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { Currency, LeaseStatus } from '@sllas/contracts';
import { LeaseApplication } from './lease-application.entity';
import { Parcel } from '../parcels/parcel.entity';
import { ClientProfile } from '../client-profiles/client-profile.entity';
import { User } from '../identity/user.entity';

@Entity('leases')
export class Lease {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lease_number', type: 'varchar', length: 100, unique: true })
  @Index('idx_leases_number')
  leaseNumber: string;

  @Column({ name: 'application_id', type: 'uuid', unique: true })
  applicationId: string;

  @ManyToOne(() => LeaseApplication)
  @JoinColumn({ name: 'application_id' })
  application: LeaseApplication;

  @Column({ name: 'parcel_id', type: 'uuid' })
  @Index('idx_leases_parcel')
  parcelId: string;

  @ManyToOne(() => Parcel)
  @JoinColumn({ name: 'parcel_id' })
  parcel: Parcel;

  @Column({ name: 'client_profile_id', type: 'uuid' })
  @Index('idx_leases_client')
  clientProfileId: string;

  @ManyToOne(() => ClientProfile)
  @JoinColumn({ name: 'client_profile_id' })
  clientProfile: ClientProfile;

  @Column({ name: 'lease_period', type: 'tstzrange' })
  leasePeriod: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'annual_rent', type: 'decimal', precision: 14, scale: 2 })
  annualRent: number;

  @Column({ type: 'enum', enum: Currency, default: Currency.USD })
  currency: Currency;

  @Column({ name: 'terms_conditions', type: 'text', nullable: true })
  termsConditions: string | null;

  @Column({ type: 'enum', enum: LeaseStatus, default: LeaseStatus.ACTIVE })
  @Index('idx_leases_status')
  status: LeaseStatus;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedByUser: User | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @VersionColumn({ default: 1 })
  version: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
