import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('🚀 Starting Phase 8 migration...');
  
  try {
    const migrationPath = path.join(process.cwd(), 'drizzle/manual_0009_phase8_rebuild.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Remove comments first
    const cleanSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    // Split by semicolons, but handle DO blocks specially
    const statements: string[] = [];
    let currentStatement = '';
    let inDoBlock = false;
    
    for (let i = 0; i < cleanSQL.length; i++) {
      const char = cleanSQL[i];
      const remaining = cleanSQL.substring(i);
      
      // Check for DO block start
      if (remaining.startsWith('DO $$')) {
        inDoBlock = true;
      }
      
      // Check for DO block end
      if (inDoBlock && remaining.startsWith('END $$;')) {
        currentStatement += 'END $$;';
        statements.push(currentStatement.trim());
        currentStatement = '';
        inDoBlock = false;
        i += 6; // Skip "END $$;"
        continue;
      }
      
      currentStatement += char;
      
      // Split on semicolon only if not in DO block
      if (char === ';' && !inDoBlock) {
        const stmt = currentStatement.trim();
        if (stmt.length > 0) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}: ${preview}...`);
        try {
          await db.execute(sql.raw(statement));
          console.log(`   ✓ Success`);
        } catch (error: any) {
          // Ignore "already exists" and "does not exist" errors
          const errorMsg = error.message || '';
          const causeMsg = error.cause?.message || '';
          const fullMsg = errorMsg + ' ' + causeMsg;
          
          if (fullMsg.includes('already exists') || fullMsg.includes('does not exist')) {
            console.log(`   ⚠️  Skipping (already exists)`);
          } else {
            console.error(`   ❌ Failed: ${errorMsg}`);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Phase 8 migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
