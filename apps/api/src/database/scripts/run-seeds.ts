import { AppDataSource } from '../../modules/database/data-source';
import { seedPlatformReferenceData } from '../seeds/01-seed-platform-reference-data';
import { seedParcelsAndClients } from '../seeds/02-seed-parcels-and-clients';

async function run() {
  console.log('🔄 Initializing data source for seeding...');
  await AppDataSource.initialize();
  await seedPlatformReferenceData(AppDataSource);
  await seedParcelsAndClients(AppDataSource);
  await AppDataSource.destroy();
  console.log('🏁 Seeding complete.');
}

run().catch(err => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
