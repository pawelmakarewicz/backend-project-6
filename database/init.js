import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function initDatabase() {
  try {
    console.log('🔄 Creating users table...')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)

    console.log('✅ Table created successfully')

    await pool.end()
    process.exit(0)
  }
  catch (error) {
    console.error('❌ Error:', error.message)
    await pool.end()
    process.exit(1)
  }
}

initDatabase()
