import 'dotenv/config';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    console.log('🚀 Running Product Manager v3 migration...\n');

    const migrationPath = path.join(process.cwd(), 'drizzle/manual_0010_product_manager_v3.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by semicolon and filter empty statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 80)}...`);
      try {
        await db.execute(sql.raw(statement));
        console.log('✅ Success\n');
      } catch (error: any) {
        // Skip "already exists" errors
        if (error.message?.includes('already exists')) {
          console.log('⚠️  Already exists, skipping\n');
        } else {
          throw error;
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
