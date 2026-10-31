import dataSource from '../data-source';
import { seedCategories } from './seed-categories';
import { seedLocations } from './seed-locations';
import { seedPlatformFee } from './seed-platform-fee';
import { seedSkills } from './seed-skills';

async function runSeed(): Promise<void> {
  const ds = await dataSource.initialize();

  try {
    console.log('Seeding database...');

    // All are idempotent (upsert / existence-checked), so this is safe to re-run
    // against an already-populated database as well as a fresh one.
    await seedCategories(ds);
    await seedSkills(ds);
    await seedLocations(ds);
    await seedPlatformFee(ds);

    console.log('Seeding complete.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await ds.destroy();
  }
}

void runSeed();
