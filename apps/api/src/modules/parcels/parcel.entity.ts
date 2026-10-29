import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  VersionColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  ParcelStatus,
  SoilType,
  NaturalRegion,
  RoadAccess,
  Terrain,
} from '@sllas/contracts';
import { LandCategory } from './land-category.entity';
import { AdminArea } from '../organizations/admin-area.entity';
import { User } from '../identity/user.entity';

@Entity('parcels')
export class Parcel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reference_number', type: 'varchar', length: 100, unique: true })
  @Index('idx_parcels_reference')
  referenceNumber: string;

  @Column({ name: 'province_id', type: 'uuid' })
  @Index('idx_parcels_province')
  provinceId: string;

  @ManyToOne(() => AdminArea)
  @JoinColumn({ name: 'province_id' })
  province: AdminArea;

  @Column({ name: 'district_id', type: 'uuid' })
  @Index('idx_parcels_district')
  districtId: string;

  @ManyToOne(() => AdminArea)
  @JoinColumn({ name: 'district_id' })
  district: AdminArea;

  @Column({ name: 'ward_id', type: 'uuid', nullable: true })
  wardId: string | null;

  @Column({ name: 'land_category_id', type: 'uuid' })
  @Index('idx_parcels_category')
  landCategoryId: string;

  @ManyToOne(() => LandCategory)
  @JoinColumn({ name: 'land_category_id' })
  landCategory: LandCategory;

  @Column({ name: 'area_hectares', type: 'decimal', precision: 14, scale: 4 })
  @Index('idx_parcels_hectares')
  areaHectares: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  boundary: any;

  @Column({ name: 'boundary_geojson', type: 'jsonb' })
  boundaryGeojson: {
    type: 'Polygon';
    coordinates: number[][][];
  };

  @Column({ name: 'centroid_lat', type: 'decimal', precision: 10, scale: 6, nullable: true })
  centroidLat: number | null;

  @Column({ name: 'centroid_lng', type: 'decimal', precision: 10, scale: 6, nullable: true })
  centroidLng: number | null;

  @Column({
    type: 'enum',
    enum: ParcelStatus,
    default: ParcelStatus.DRAFT,
  })
  @Index('idx_parcels_status')
  status: ParcelStatus;

  @Column({
    name: 'soil_type',
    type: 'enum',
    enum: SoilType,
    nullable: true,
  })
  @Index('idx_parcels_soil_type')
  soilType: SoilType | null;

  @Column({
    name: 'natural_region',
    type: 'enum',
    enum: NaturalRegion,
    nullable: true,
  })
  @Index('idx_parcels_natural_region')
  naturalRegion: NaturalRegion | null;

  @Column({ name: 'rainfall_band', type: 'varchar', length: 50, nullable: true })
  rainfallBand: string | null;

  @Column({ name: 'water_access', type: 'boolean', default: false })
  waterAccess: boolean;

  @Column({ name: 'water_sources', type: 'varchar', length: 255, nullable: true })
  waterSources: string | null;

  @Column({
    name: 'road_access',
    type: 'enum',
    enum: RoadAccess,
    default: RoadAccess.DIRT_TRACK,
  })
  roadAccess: RoadAccess;

  @Column({ name: 'electricity_available', type: 'boolean', default: false })
  electricityAvailable: boolean;

  @Column({ name: 'grid_proximity_km', type: 'decimal', precision: 6, scale: 2, nullable: true })
  gridProximityKm: number | null;

  @Column({
    type: 'enum',
    enum: Terrain,
    default: Terrain.FLAT,
  })
  terrain: Terrain;

  @Column({ name: 'current_use', type: 'varchar', length: 255, default: 'Idle / Unused' })
  currentUse: string;

  @Column({ name: 'previous_use', type: 'varchar', length: 255, nullable: true })
  previousUse: string | null;

  @Column({ name: 'zoning_permitted_uses', type: 'varchar', length: 255, nullable: true })
  zoningPermittedUses: string | null;

  @Column({ type: 'text', nullable: true })
  restrictions: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'registered_by', type: 'uuid' })
  registeredBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'registered_by' })
  registeredByUser: User;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifiedByUser: User | null;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @VersionColumn({ default: 1 })
  version: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
