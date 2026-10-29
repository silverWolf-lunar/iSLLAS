import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('user_identities')
export class UserIdentity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index('idx_user_identities_user_id')
  userId: string;

  @Column({ type: 'varchar', length: 50, default: 'keycloak' })
  provider: string;

  @Column({ name: 'provider_subject', type: 'varchar', length: 255, unique: true })
  @Index('idx_user_identities_subject')
  providerSubject: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
