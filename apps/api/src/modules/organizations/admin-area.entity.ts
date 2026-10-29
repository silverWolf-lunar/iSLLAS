import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AdminAreaLevel } from '@sllas/contracts';

@Entity('admin_areas')
export class AdminArea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  @Index('idx_admin_area_name')
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: AdminAreaLevel,
  })
  @Index('idx_admin_area_level')
  level: AdminAreaLevel;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  @Index('idx_admin_area_parent_id')
  parentId: string | null;

  @Column({ name: 'centroid_lat', type: 'numeric', precision: 10, scale: 6, nullable: true })
  centroidLat: number | null;

  @Column({ name: 'centroid_lng', type: 'numeric', precision: 10, scale: 6, nullable: true })
  centroidLng: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
