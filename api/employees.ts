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
        SELECT 
          id, 
          name, 
          sim_number as "simNumber", 
          whatsapp_number as "whatsappNumber", 
          role, 
          status, 
          total_calls_answered as "totalCallsAnswered"
        FROM company_employees
        ORDER BY created_at ASC;
      `;
      return res.status(200).json({ employees: rows, source: 'neon' });
    }

    if (req.method === 'POST') {
      const { id, name, simNumber, whatsappNumber, role, status, totalCallsAnswered } = req.body;
      if (!name || !simNumber) {
        return res.status(400).json({ error: 'Name and SIM number are required' });
      }

      const empId = id || `emp-${Date.now()}`;
      const waNumber = whatsappNumber || simNumber;
      const empRole = role || 'Support & Dispatch Executive';
      const empStatus = status || 'available';
      const callsCount = totalCallsAnswered || 0;

      await sql`
        INSERT INTO company_employees (id, name, sim_number, whatsapp_number, role, status, total_calls_answered)
        VALUES (${empId}, ${name}, ${simNumber}, ${waNumber}, ${empRole}, ${empStatus}, ${callsCount})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          sim_number = EXCLUDED.sim_number,
          whatsapp_number = EXCLUDED.whatsapp_number,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          total_calls_answered = EXCLUDED.total_calls_answered;
      `;

      return res.status(200).json({ success: true, id: empId });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        await sql`DELETE FROM company_employees;`;
        return res.status(200).json({ success: true, message: 'All employees cleared' });
      }

      await sql`DELETE FROM company_employees WHERE id = ${id};`;
      return res.status(200).json({ success: true, deletedId: id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API /api/employees error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
