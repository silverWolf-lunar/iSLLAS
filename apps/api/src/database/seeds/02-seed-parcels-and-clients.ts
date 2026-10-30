import { DataSource } from 'typeorm';

export async function seedParcelsAndClients(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    console.log('🌱 Seeding parcels and client profiles...');

    // 1. Ensure verified client profiles for all CLIENT role users
    const clientUsers = await queryRunner.query(
      `SELECT id, email, "first_name", "last_name" FROM "users" WHERE role = 'CLIENT'`
    );

    const defaultProv = (await queryRunner.query(`SELECT id FROM "admin_areas" WHERE level = 'PROVINCE' LIMIT 1`))[0]?.id;
    const defaultDist = (await queryRunner.query(`SELECT id FROM "admin_areas" WHERE level = 'DISTRICT' AND parent_id = $1 LIMIT 1`, [defaultProv]))[0]?.id;

    for (const u of clientUsers) {
      await queryRunner.query(
        `INSERT INTO "client_profiles" (
          "user_id", "client_type", "national_id_number", "company_name",
          "address", "province_id", "district_id", "verification_status"
        )
        VALUES (
          $1, 'INDIVIDUAL', '63-189422-K-42', 'Munhumutapa Agro Holdings',
          'Block 2 Makombe Complex, Harare, Zimbabwe', $2, $3, 'VERIFIED'
        )
        ON CONFLICT ("user_id") DO UPDATE SET "verification_status" = 'VERIFIED';`,
        [u.id, defaultProv, defaultDist]
      );
    }
    console.log(`✅ Verified profiles ensured for ${clientUsers.length} client users`);

    // 2. Fetch required reference records
    const categories = await queryRunner.query(`SELECT id, code FROM "land_categories"`);
    const stateLandCat = categories.find((c: any) => c.code === 'STATE_LAND') || categories[0];
    const a2CommercialCat = categories.find((c: any) => c.code === 'A2_COMMERCIAL') || stateLandCat;

    const provinces = await queryRunner.query(`SELECT id, code, name FROM "admin_areas" WHERE level = 'PROVINCE'`);
    const adminUser = (await queryRunner.query(`SELECT id FROM "users" LIMIT 1`))[0];
    const registeredBy = adminUser ? adminUser.id : clientUsers[0]?.id;

    const seedParcelsData = [
      {
        ref: 'PAR-2026-MC-001',
        provName: 'Mashonaland Central',
        distSearch: 'Mazowe',
        area: 120.0,
        name: 'Mazowe Citrus & Cropping Estate',
        soil: 'LOAM',
        region: 'II',
        lat: -17.52,
        lng: 30.98,
        poly: [
          [30.97, -17.51],
          [31.00, -17.51],
          [31.00, -17.54],
          [30.97, -17.54],
          [30.97, -17.51],
        ],
      },
      {
        ref: 'PAR-2026-MC-002',
        provName: 'Mashonaland Central',
        distSearch: 'Bindura',
        area: 85.0,
        name: 'Bindura Commercial Farmland Unit 4',
        soil: 'CLAY',
        region: 'II',
        lat: -17.30,
        lng: 31.32,
        poly: [
          [31.31, -17.29],
          [31.34, -17.29],
          [31.34, -17.32],
          [31.31, -17.32],
          [31.31, -17.29],
        ],
      },
      {
        ref: 'PAR-2026-MC-003',
        provName: 'Mashonaland Central',
        distSearch: 'Shamva',
        area: 150.0,
        name: 'Shamva Goldfields Agro-Valley',
        soil: 'LOAM',
        region: 'II',
        lat: -17.18,
        lng: 31.57,
        poly: [
          [31.55, -17.17],
          [31.59, -17.17],
          [31.59, -17.20],
          [31.55, -17.20],
          [31.55, -17.17],
        ],
      },
      {
        ref: 'PAR-2026-MW-001',
        provName: 'Mashonaland West',
        distSearch: 'Makonde',
        area: 250.0,
        name: 'Banket Commercial Grain Farm',
        soil: 'LOAM',
        region: 'II',
        lat: -17.38,
        lng: 30.40,
        poly: [
          [30.38, -17.36],
          [30.43, -17.36],
          [30.43, -17.40],
          [30.38, -17.40],
          [30.38, -17.36],
        ],
      },
      {
        ref: 'PAR-2026-MW-002',
        provName: 'Mashonaland West',
        distSearch: 'Makonde',
        area: 180.0,
        name: 'Chinhoyi North Model A2 Plot',
        soil: 'CLAY',
        region: 'II',
        lat: -17.33,
        lng: 30.18,
        poly: [
          [30.16, -17.31],
          [30.20, -17.31],
          [30.20, -17.35],
          [30.16, -17.35],
          [30.16, -17.31],
        ],
      },
      {
        ref: 'PAR-2026-ME-001',
        provName: 'Mashonaland East',
        distSearch: 'Marondera',
        area: 65.0,
        name: 'Marondera Horticultural Unit 12',
        soil: 'SANDY',
        region: 'II',
        lat: -18.18,
        lng: 31.55,
        poly: [
          [31.53, -18.16],
          [31.57, -18.16],
          [31.57, -18.20],
          [31.53, -18.20],
          [31.53, -18.16],
        ],
      },
      {
        ref: 'PAR-2026-MID-001',
        provName: 'Midlands',
        distSearch: 'Kwekwe',
        area: 300.0,
        name: 'Kwekwe Agro-Industrial Estate',
        soil: 'LOAM',
        region: 'III',
        lat: -18.92,
        lng: 29.81,
        poly: [
          [29.79, -18.90],
          [29.84, -18.90],
          [29.84, -18.94],
          [29.79, -18.94],
          [29.79, -18.90],
        ],
      },
      {
        ref: 'PAR-2026-MV-001',
        provName: 'Masvingo',
        distSearch: 'Chiredzi',
        area: 400.0,
        name: 'Chiredzi Cane & Cattle Block',
        soil: 'CLAY',
        region: 'V',
        lat: -21.05,
        lng: 31.67,
        poly: [
          [31.64, -21.03],
          [31.70, -21.03],
          [31.70, -21.08],
          [31.64, -21.08],
          [31.64, -21.03],
        ],
      },
    ];

    let createdCount = 0;
    for (const p of seedParcelsData) {
      const prov = provinces.find((pr: any) => pr.name.toLowerCase() === p.provName.toLowerCase()) || provinces[0];
      const districts = await queryRunner.query(
        `SELECT id FROM "admin_areas" WHERE level = 'DISTRICT' AND parent_id = $1 AND name ILIKE $2`,
        [prov.id, `%${p.distSearch}%`]
      );
      const districtId = districts[0]?.id || (await queryRunner.query(`SELECT id FROM "admin_areas" WHERE level = 'DISTRICT' AND parent_id = $1 LIMIT 1`, [prov.id]))[0]?.id;

      const boundaryGeojson = {
        type: 'Polygon',
        coordinates: [p.poly],
      };
      const geojsonString = JSON.stringify(boundaryGeojson);

      await queryRunner.query(
        `INSERT INTO "parcels" (
          "reference_number", "province_id", "district_id", "land_category_id",
          "area_hectares", "boundary", "boundary_geojson", "centroid_lat", "centroid_lng",
          "status", "registered_by", "soil_type", "natural_region", "road_access",
          "terrain", "current_use", "notes"
        )
        VALUES (
          $1, $2, $3, $4,
          $5, ST_SetSRID(ST_GeomFromGeoJSON($6), 4326), $6::jsonb, $7, $8,
          'AVAILABLE', $9, $10, $11, 'GRAVEL',
          'GENTLY_UNDULATING', 'State Land Farmland', $12
        )
        ON CONFLICT ("reference_number") DO UPDATE SET "status" = 'AVAILABLE';`,
        [
          p.ref,
          prov.id,
          districtId,
          a2CommercialCat.id,
          p.area,
          geojsonString,
          p.lat,
          p.lng,
          registeredBy,
          p.soil,
          p.region,
          p.name,
        ]
      );
      createdCount++;
    }

    console.log(`✅ Seeded ${createdCount} Available Agricultural Parcels into Cadastre`);
  } finally {
    await queryRunner.release();
  }
}
