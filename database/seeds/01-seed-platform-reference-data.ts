import { DataSource } from 'typeorm';
import { ZIMBABWE_PROVINCES } from '@sllas/config';
import { Role, OfficeLevel, AdminAreaLevel } from '@sllas/contracts';

export async function seedPlatformReferenceData(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  console.log('🌱 Starting Platform Reference Data Seeding...');

  try {
    // 1. Seed Roles
    const rolesData = [
      { name: Role.SYSTEM_ADMIN, description: 'Full system administration and configuration' },
      { name: Role.REGISTRY_OFFICER, description: 'Land parcel registration, verification, application review' },
      { name: Role.APPROVER, description: 'Senior land board approver for applications and leases' },
      { name: Role.ESTATES_OFFICER, description: 'Estates officer - master waiting list monitoring, lease generation, and legal agreements' },
      { name: Role.AUDITOR, description: 'Read-only compliance and audit history inspector' },
      { name: Role.CLIENT, description: 'Citizen or business applicant for land leases' },
    ];

    for (const r of rolesData) {
      await queryRunner.query(
        `INSERT INTO "roles" ("name", "description")
         VALUES ($1, $2)
         ON CONFLICT ("name") DO UPDATE SET "description" = EXCLUDED."description";`,
        [r.name, r.description],
      );
    }
    console.log('✅ Roles seeded');

    // 2. Seed Permissions
    const permissionsData = [
      // Parcels
      { code: 'parcel:create', module: 'land-registry', description: 'Create draft land parcel' },
      { code: 'parcel:edit', module: 'land-registry', description: 'Edit draft land parcel' },
      { code: 'parcel:verify', module: 'land-registry', description: 'Verify parcel for public availability' },
      { code: 'parcel:view_internal', module: 'land-registry', description: 'View full internal parcel details' },
      { code: 'parcel:search_public', module: 'land-registry', description: 'Search available parcels' },
      // Applications
      { code: 'application:submit', module: 'applications', description: 'Submit lease application' },
      { code: 'application:view_own', module: 'applications', description: 'View own lease applications' },
      { code: 'application:view_all', module: 'applications', description: 'View all lease applications in jurisdiction' },
      { code: 'application:review', module: 'applications', description: 'Review and conduct inspection on application' },
      { code: 'application:approve', module: 'applications', description: 'Approve or reject lease application' },
      // Leases
      { code: 'lease:view', module: 'leases', description: 'View lease agreements' },
      { code: 'lease:issue_offer', module: 'leases', description: 'Issue official lease offer' },
      { code: 'lease:sign', module: 'leases', description: 'Sign lease agreement' },
      { code: 'lease:renew', module: 'leases', description: 'Request or approve lease renewal' },
      { code: 'lease:terminate', module: 'leases', description: 'Terminate lease agreement' },
      // Recommendations & Reports
      { code: 'recommendation:run', module: 'recommendations', description: 'Run recommendation engine' },
      { code: 'recommendation:manage_rules', module: 'recommendations', description: 'Edit activity profile rules' },
      { code: 'audit:view', module: 'audit', description: 'View audit logs' },
      { code: 'reports:view', module: 'reporting', description: 'View operational reports' },
      { code: 'system:admin', module: 'administration', description: 'Manage system settings and users' },
    ];

    for (const p of permissionsData) {
      await queryRunner.query(
        `INSERT INTO "permissions" ("code", "module", "description")
         VALUES ($1, $2, $3)
         ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description";`,
        [p.code, p.module, p.description],
      );
    }
    console.log('✅ Permissions seeded');

    // 3. Seed Zimbabwe Provinces & Districts
    const provinceIdMap: Record<string, string> = {};

    for (const prov of ZIMBABWE_PROVINCES) {
      const res = await queryRunner.query(
        `INSERT INTO "admin_areas" ("name", "code", "level")
         VALUES ($1, $2, $3)
         ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name"
         RETURNING "id";`,
        [prov.name, prov.id, AdminAreaLevel.PROVINCE],
      );
      const provId = res[0].id;
      provinceIdMap[prov.name] = provId;

      // Seed Districts under Province
      for (const districtName of prov.districts) {
        const districtCode = `${prov.id}-${districtName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
        await queryRunner.query(
          `INSERT INTO "admin_areas" ("name", "code", "level", "parent_id")
           VALUES ($1, $2, $3, $4)
           ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";`,
          [districtName, districtCode, AdminAreaLevel.DISTRICT, provId],
        );
      }
    }
    console.log('✅ 10 Zimbabwe Provinces & Districts seeded');

    // 4. Seed Registry Offices
    const harareProvId = provinceIdMap['Harare'];
    const midlandsProvId = provinceIdMap['Midlands'];
    const bulawayoProvId = provinceIdMap['Bulawayo'];

    const officesData = [
      {
        name: 'National Land Registry Headquarters',
        code: 'OFF-NAT-HRE',
        level: OfficeLevel.NATIONAL,
        provinceId: harareProvId,
        address: 'Makombe Complex, Herbert Chitepo Ave, Harare',
        email: 'registry.national@sllas.gov.zw',
        phone: '+263242700000',
      },
      {
        name: 'Harare Provincial Land Registry',
        code: 'OFF-PROV-HRE',
        level: OfficeLevel.PROVINCIAL,
        provinceId: harareProvId,
        address: 'Old Mutual Centre, Third Street, Harare',
        email: 'registry.harare@sllas.gov.zw',
        phone: '+263242700001',
      },
      {
        name: 'Midlands Provincial Land Registry',
        code: 'OFF-PROV-MID',
        level: OfficeLevel.PROVINCIAL,
        provinceId: midlandsProvId,
        address: 'Government Complex, Gweru',
        email: 'registry.midlands@sllas.gov.zw',
        phone: '+26354222000',
      },
      {
        name: 'Bulawayo Metropolitan Land Registry',
        code: 'OFF-PROV-BYO',
        level: OfficeLevel.PROVINCIAL,
        provinceId: bulawayoProvId,
        address: 'Mhlahlandlela Government Complex, Bulawayo',
        email: 'registry.bulawayo@sllas.gov.zw',
        phone: '+26329288000',
      },
    ];

    const officeIdMap: Record<string, string> = {};
    for (const off of officesData) {
      const res = await queryRunner.query(
        `INSERT INTO "organizations" ("name", "code", "level", "province_id", "address", "email", "phone_number")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name"
         RETURNING "id";`,
        [off.name, off.code, off.level, off.provinceId, off.address, off.email, off.phone],
      );
      officeIdMap[off.code] = res[0].id;
    }
    console.log('✅ Registry Offices seeded');

    console.log('✅ Reference data seeded; user accounts must be provisioned through Keycloak and administration workflows.');
  } finally {
    await queryRunner.release();
  }
}
