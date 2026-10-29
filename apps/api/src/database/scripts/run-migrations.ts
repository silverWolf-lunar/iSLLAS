import { AppDataSource } from '../../modules/database/data-source';

async function run() {
  console.log('🔄 Initializing data source for migrations...');
  await AppDataSource.initialize();
  console.log('🚀 Running pending migrations...');
  const migrations = await AppDataSource.runMigrations();
  console.log(`✅ Applied ${migrations.length} migrations:`);
  migrations.forEach(m => console.log(`   - ${m.name}`));
  await AppDataSource.destroy();
  console.log('🏁 Migrations complete.');
}

run().catch(err => {
  console.error('❌ Migration error:', err);
  process.exit(1);
});
