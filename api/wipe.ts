import { getDb, ensureTablesExist } from './db.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  const sql = getDb();
  if (!sql) {
    return res.status(200).json({ error: 'DATABASE_URL not configured', source: 'offline' });
  }

  await ensureTablesExist(sql);

  try {
    if (req.method === 'POST') {
      await sql`DELETE FROM customer_call_logs;`;
      await sql`DELETE FROM company_employees;`;

      return res.status(200).json({ success: true, message: 'All demo employees and call history wiped from Neon!' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API /api/wipe error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
