import 'dotenv/config';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function verify() {
  try {
    console.log('🔍 Verifying Product Manager v3 migration...\n');
    
    const result: any = await db.execute(sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products_v2' 
      AND column_name IN (
        'youtube_url', 
        'compare_at_price_cents', 
        'unit', 
        'track_inventory', 
        'quantity', 
        'personalization_enabled', 
        'personalization_prompt', 
        'brand_id'
      )
      ORDER BY column_name
    `);
    
    console.log('✅ Found columns in products_v2:');
    for (const row of result) {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    }
    
    // Check brands table
    const brandsCheck: any = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'brands'
      ) as exists
    `);
    
    if (brandsCheck[0]?.exists) {
      console.log('\n✅ brands table exists');
    } else {
      console.log('\n❌ brands table NOT found');
    }
    
    console.log('\n🎉 Migration verification complete!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verify();
