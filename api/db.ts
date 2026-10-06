import { neon } from '@neondatabase/serverless';

let isInitialized = false;

export function getDb() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    return null;
  }
  return neon(connectionString);
}

export async function ensureTablesExist(sql: any) {
  if (isInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS company_settings (
        key VARCHAR(64) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS company_employees (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        sim_number VARCHAR(64) NOT NULL,
        whatsapp_number VARCHAR(64) NOT NULL,
        role VARCHAR(128) DEFAULT 'Support & Dispatch Executive',
        status VARCHAR(32) DEFAULT 'available',
        total_calls_answered INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS customer_call_logs (
        id VARCHAR(64) PRIMARY KEY,
        customer_name VARCHAR(128) NOT NULL,
        customer_phone VARCHAR(64) NOT NULL,
        answered_by_employee_id VARCHAR(64),
        answered_by_employee_name VARCHAR(128),
        channel VARCHAR(32) DEFAULT 'sim',
        duration_seconds INT DEFAULT 0,
        status VARCHAR(32) DEFAULT 'answered',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    isInitialized = true;
  } catch (err) {
    console.error('Error ensuring tables in Neon:', err);
  }
}
