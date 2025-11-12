import 'dotenv/config';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('🚀 Running Product Manager v3 migration (DIRECT)...\n');

    // Add columns one by one
    console.log('Adding youtube_url column...');
    await db.execute(sql`ALTER TABLE products_v2 ADD COLUMN IF NOT EXISTS youtube_url TEXT`);
    
    console.log('Adding compare_at_price_cents column...');
    await db.execute(sql`ALTER TABLE products_v2 ADD COLUMN IF NOT EXISTS compare_at_price_cents INTEGER`);
    
    console.log('Adding unit column...');
    await db.execute(sql`ALTER TABLE products_v2 ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'Unit'`);
    
    console.log('Adding track_inventory column...');
    await db.execute(sql`ALTER TABLE products_v2 ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT false`);
    
    console.log('Adding quantity column...');
    await db.execute(sql`ALTER TABLE products_v2 ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0`);
    
    console.log('Adding personalization_enabled column...');
    await db.execute(sql`ALTER TABLE products_v2 ADD COLUMN IF NOT EXISTS personalization_enabled BOOLEAN DEFAULT false`);
    
    console.log('Adding personalization_prompt column...');
    await db.execute(sql`ALTER TABLE products_v2 ADD COLUMN IF NOT EXISTS personalization_prompt TEXT`);
    
    console.log('Adding brand_id column...');
    await db.execute(sql`ALTER TABLE products_v2 ADD COLUMN IF NOT EXISTS brand_id UUID`);

    // Create brands table
    console.log('Creating brands table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS brands (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, slug)
      )
    `);

    // Add foreign key (might fail if already exists, that's ok)
    console.log('Adding brand foreign key...');
    try {
      await db.execute(sql`
        ALTER TABLE products_v2
        ADD CONSTRAINT products_v2_brand_id_fkey 
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
      `);
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('  ⚠️  Foreign key already exists, skipping');
      } else {
        throw e;
      }
    }

    // Create indexes
    console.log('Creating indexes...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS brands_user_id_idx ON brands(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS products_v2_brand_id_idx ON products_v2(brand_id)`);

    console.log('\n✅ Migration completed successfully!');
    console.log('\nVerifying columns...');
    
    // Verify the columns exist
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products_v2' 
      AND column_name IN ('youtube_url', 'compare_at_price_cents', 'unit', 'track_inventory', 'quantity', 'personalization_enabled', 'personalization_prompt', 'brand_id')
      ORDER BY column_name
    `);
    
    console.log('Columns found:', result.rows.map((r: any) => r.column_name).join(', '));
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runMigration();
