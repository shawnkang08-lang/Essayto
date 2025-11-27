import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running database migrations...');
    
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of executed migrations
    const { rows: executedMigrations } = await client.query(
      'SELECT name FROM migrations ORDER BY id'
    );
    const executedNames = new Set(executedMigrations.map(m => m.name));
    
    // Migration files in order
    const migrations = [
      '001_create_users_table.sql',
      '002_create_essays_table.sql',
      '003_create_progress_snapshots_table.sql',
    ];
    
    // Run pending migrations
    for (const migrationFile of migrations) {
      if (executedNames.has(migrationFile)) {
        console.log(`⏭️  Skipping ${migrationFile} (already executed)`);
        continue;
      }
      
      console.log(`▶️  Running ${migrationFile}...`);
      
      const migrationPath = join(__dirname, '../../migrations', migrationFile);
      const sql = readFileSync(migrationPath, 'utf-8');
      
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migrationFile]
        );
        await client.query('COMMIT');
        console.log(`✅ ${migrationFile} completed`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    
    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
