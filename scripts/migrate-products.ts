import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../lib/db';
import fs from 'fs';
import path from 'path';

async function migrate() {
  try {
    const migrationSQL = fs.readFileSync(
      path.join(process.cwd(), 'drizzle/manual_0004_recreate_products.sql'),
      'utf-8'
    );

    // Execute the entire migration as one transaction
    console.log('Executing migration...');
    await db.execute(sql.raw(migrationSQL));

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
