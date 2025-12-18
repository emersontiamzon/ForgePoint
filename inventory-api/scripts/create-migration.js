const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure migrations directory exists
const migrationsDir = path.join(__dirname, '..', 'src', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Get migration name from command line arguments
const migrationName = process.argv[2];
if (!migrationName) {
  console.error('Please provide a migration name');
  console.log('Usage: npm run create-migration -- <migration-name>');
  process.exit(1);
}

// Create timestamp for filename
const timestamp = new Date()
  .toISOString()
  .replace(/[-:]/g, '')
  .replace(/\.\d+/, '')
  .replace('T', '_');

// Create migration filename
const filename = `${timestamp}_${migrationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.sql`;
const filepath = path.join(migrationsDir, filename);

// Create empty migration file
fs.writeFileSync(filepath, `-- Migration: ${migrationName}\n\n-- Up migration\n\n-- Down migration (rollback)\n`, 'utf8');

console.log(`Created migration: ${filepath}`);

// Open the file in the default editor if possible
try {
  if (process.platform === 'win32') {
    execSync(`start "" "${filepath}"`, { stdio: 'ignore' });
  } else if (process.platform === 'darwin') {
    execSync(`open "${filepath}"`, { stdio: 'ignore' });
  } else {
    execSync(`xdg-open "${filepath}"`, { stdio: 'ignore' });
  }
} catch (err) {
  // Ignore errors with opening the file
}
