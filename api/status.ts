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
      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ error: 'ID and status are required' });
      }

      await sql`
        UPDATE company_employees
        SET status = ${status}
        WHERE id = ${id};
      `;

      return res.status(200).json({ success: true, id, status });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API /api/status error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
