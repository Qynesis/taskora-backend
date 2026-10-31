import dataSource from './data-source';

async function ensureSchema(): Promise<void> {
  const ds = await dataSource.initialize();
  try {
    await ds.query('CREATE SCHEMA IF NOT EXISTS "service"');
    console.log('Schema "service" ready.');
  } finally {
    await ds.destroy();
  }
}

ensureSchema().catch((error) => {
  console.error('Failed to ensure schema:', error);
  process.exit(1);
});
