import fs from 'fs';
import path from 'path';
import { query } from '../db';

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

export async function runMigrations() {
  // Create migrations table if it doesn't exist
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // Get all applied migrations
  const appliedMigrations = await query<{name: string}>(
    'SELECT name FROM migrations ORDER BY name'
  );
  const appliedMigrationNames = new Set(appliedMigrations.rows.map(m => m.name));

  // Read migration files
  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();

  // Run new migrations
  for (const file of migrationFiles) {
    if (!appliedMigrationNames.has(file)) {
      console.log(`Running migration: ${file}`);
      
      // Read and execute the migration SQL
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      
      try {
        await query('BEGIN');
        await query(sql);
        
        // Record the migration
        await query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        
        await query('COMMIT');
        console.log(`✓ Applied migration: ${file}`);
      } catch (err) {
        await query('ROLLBACK');
        console.error(`✗ Failed to apply migration ${file}:`, err);
        throw err;
      }
    }
  }

  console.log('All migrations have been applied');
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
