const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('🔧 Resetting migration table...');
  
  try {
    await client.connect();
    
    // Drop migration table completely
    await client.query('DROP TABLE IF EXISTS _prisma_migrations CASCADE;');
    console.log('✅ Migration table dropped');
    
    await client.end();
    
    console.log('🚀 Ready for clean migration');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
