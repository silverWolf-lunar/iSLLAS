import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('parcel_verifications')
export class ParcelVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'parcel_id', type: 'uuid' })
  @Index('idx_parcel_verifications_parcel_id')
  parcelId: string;

  @Column({ name: 'officer_id', type: 'uuid' })
  @Index('idx_parcel_verifications_officer_id')
  officerId: string;

  @Column({ type: 'varchar', length: 50 })
  action: string; // 'SUBMIT', 'VERIFY', 'RETURN_FOR_CORRECTION'

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  checklist: Record<string, boolean> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
