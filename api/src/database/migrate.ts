import { runMigrations } from './db';

(async () => {
  try {
    await runMigrations();
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
})();
