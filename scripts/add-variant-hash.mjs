import 'dotenv/config';
import { db } from '../lib/db/index.ts';
import { sql } from 'drizzle-orm';

async function addVariantHash() {
  try {
    console.log('Enabling pgcrypto extension...');
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    console.log('Creating hash function...');
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION generate_option_values_hash(option_values_json TEXT)
      RETURNS TEXT AS $$
      BEGIN
        RETURN encode(
          digest(
            (
              SELECT string_agg(key || ':' || value, '|' ORDER BY key)
              FROM jsonb_each_text(option_values_json::jsonb)
            ),
            'sha256'
          ),
          'hex'
        );
      END;
      $$ LANGUAGE plpgsql IMMUTABLE;
    `);

    console.log('Creating trigger function...');
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_variant_hash()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.option_values_json IS NOT NULL THEN
          NEW.option_values_hash = generate_option_values_hash(NEW.option_values_json);
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('Dropping old trigger if exists...');
    await db.execute(sql`DROP TRIGGER IF EXISTS variant_hash_trigger ON variants;`);

    console.log('Creating trigger...');
    await db.execute(sql`
      CREATE TRIGGER variant_hash_trigger
      BEFORE INSERT OR UPDATE OF option_values_json ON variants
      FOR EACH ROW
      EXECUTE FUNCTION update_variant_hash();
    `);

    console.log('Updating existing variants...');
    await db.execute(sql`
      UPDATE variants
      SET option_values_hash = generate_option_values_hash(COALESCE(option_values_json, '{}'))
      WHERE option_values_json IS NOT NULL;
    `);

    console.log('Creating unique index...');
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS variants_product_id_option_values_hash_unique
      ON variants (product_id, option_values_hash)
      WHERE deleted_at IS NULL;
    `);

    console.log('✅ Hash functions, triggers, and index created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addVariantHash();
