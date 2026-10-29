import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClientType, VerificationStatus } from '@sllas/contracts';
import { User } from '../identity/user.entity';
import { AdminArea } from '../organizations/admin-area.entity';

@Entity('client_profiles')
export class ClientProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  @Index('idx_client_profiles_user')
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'client_type', type: 'enum', enum: ClientType })
  clientType: ClientType;

  @Column({ name: 'national_id_number', type: 'varchar', length: 50, nullable: true })
  nationalIdNumber: string | null;

  @Column({ name: 'registration_number', type: 'varchar', length: 50, nullable: true })
  registrationNumber: string | null;

  @Column({ name: 'company_name', type: 'varchar', length: 255, nullable: true })
  companyName: string | null;

  @Column({ name: 'tax_clearance_number', type: 'varchar', length: 100, nullable: true })
  taxClearanceNumber: string | null;

  @Column({ type: 'text' })
  address: string;

  @Column({ name: 'province_id', type: 'uuid' })
  @Index('idx_client_profiles_province')
  provinceId: string;

  @ManyToOne(() => AdminArea)
  @JoinColumn({ name: 'province_id' })
  province: AdminArea;

  @Column({ name: 'district_id', type: 'uuid' })
  @Index('idx_client_profiles_district')
  districtId: string;

  @ManyToOne(() => AdminArea)
  @JoinColumn({ name: 'district_id' })
  district: AdminArea;

  @Column({ type: 'jsonb', nullable: true })
  directors: Array<{ fullName: string; nationalId: string; phoneNumber: string }> | null;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  documents: Array<{
    id: string;
    type: string;
    fileName: string;
    fileUrl: string;
    fileSizeBytes?: number;
    mimeType?: string;
    status: string;
    uploadedAt: string;
    rejectionReason?: string | null;
  }> | null;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.UNVERIFIED,
  })
  @Index('idx_client_profiles_verification_status')
  verificationStatus: VerificationStatus;

  @Column({ name: 'verification_reason', type: 'text', nullable: true })
  verificationReason: string | null;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifiedByUser: User | null;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
