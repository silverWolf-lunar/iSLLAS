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
import { ApplicationStatus } from '@sllas/contracts';
import { ClientProfile } from '../client-profiles/client-profile.entity';
import { Parcel } from '../parcels/parcel.entity';
import { User } from '../identity/user.entity';

@Entity('lease_applications')
export class LeaseApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'application_number', type: 'varchar', length: 100, unique: true })
  @Index('idx_lease_applications_number')
  applicationNumber: string;

  @Column({ name: 'client_profile_id', type: 'uuid' })
  @Index('idx_lease_applications_client')
  clientProfileId: string;

  @ManyToOne(() => ClientProfile)
  @JoinColumn({ name: 'client_profile_id' })
  clientProfile: ClientProfile;

  @Column({ name: 'parcel_id', type: 'uuid' })
  @Index('idx_lease_applications_parcel')
  parcelId: string;

  @ManyToOne(() => Parcel)
  @JoinColumn({ name: 'parcel_id' })
  parcel: Parcel;

  @Column({ name: 'activity_profile_id', type: 'uuid', nullable: true })
  activityProfileId: string | null;

  @Column({ name: 'intended_activity', type: 'varchar', length: 255 })
  intendedActivity: string;

  @Column({ name: 'business_plan_summary', type: 'text' })
  businessPlanSummary: string;

  @Column({ name: 'requested_term_years', type: 'int' })
  requestedTermYears: number;

  @Column({ name: 'proposed_investment_usd', type: 'decimal', precision: 14, scale: 2, nullable: true })
  proposedInvestmentUsd: number | null;

  @Column({ name: 'expected_jobs_created', type: 'int', nullable: true })
  expectedJobsCreated: number | null;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  @Index('idx_lease_applications_status')
  status: ApplicationStatus;

  @Column({ name: 'assigned_officer_id', type: 'uuid', nullable: true })
  assignedOfficerId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_officer_id' })
  assignedOfficer: User | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedByUser: User | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @VersionColumn({ default: 1 })
  version: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
