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
        SELECT key, value FROM company_settings;
      `;
      const settings: Record<string, string> = {};
      for (const r of rows) {
        settings[r.key] = r.value;
      }
      const mainNumber = settings['main_number'] || '+92 (42) 111-327-800';
      let freepbxConfig = null;
      if (settings['freepbx_config']) {
        try {
          freepbxConfig = JSON.parse(settings['freepbx_config']);
        } catch {}
      }
      return res.status(200).json({ mainNumber, freepbxConfig, source: 'neon' });
    }

    if (req.method === 'POST') {
      const { mainNumber, freepbxConfig } = req.body;
      if (!mainNumber && !freepbxConfig) {
        return res.status(400).json({ error: 'mainNumber or freepbxConfig is required' });
      }

      if (mainNumber) {
        await sql`
          INSERT INTO company_settings (key, value)
          VALUES ('main_number', ${mainNumber})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
        `;
      }

      if (freepbxConfig) {
        await sql`
          INSERT INTO company_settings (key, value)
          VALUES ('freepbx_config', ${JSON.stringify(freepbxConfig)})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
        `;
      }

      return res.status(200).json({ success: true, mainNumber, freepbxConfig });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API /api/company error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
