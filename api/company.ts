import { getDb, ensureTablesExist } from './db.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  const sql = getDb();
  if (!sql) {
    return res.status(200).json({ error: 'DATABASE_URL not configured', source: 'offline' });
  }

  await ensureTablesExist(sql);

  try {
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT value FROM company_settings WHERE key = 'main_number' LIMIT 1;
      `;
      const mainNumber = rows.length > 0 ? rows[0].value : '+92 (42) 111-327-800';
      return res.status(200).json({ mainNumber, source: 'neon' });
    }

    if (req.method === 'POST') {
      const { mainNumber } = req.body;
      if (!mainNumber) {
        return res.status(400).json({ error: 'mainNumber is required' });
      }

      await sql`
        INSERT INTO company_settings (key, value)
        VALUES ('main_number', ${mainNumber})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
      `;

      return res.status(200).json({ success: true, mainNumber });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API /api/company error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
