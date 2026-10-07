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
          customer_name as "customerName", 
          customer_phone as "customerPhone", 
          answered_by_employee_id as "answeredByEmployeeId", 
          answered_by_employee_name as "answeredByEmployeeName", 
          channel, 
          duration_seconds as "durationSeconds", 
          status, 
          notes, 
          created_at as "createdAt"
        FROM customer_call_logs
        ORDER BY created_at DESC
        LIMIT 50;
      `;
      const formatted = rows.map((r: any) => ({
        id: r.id,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        answeredByEmployeeId: r.answeredByEmployeeId,
        answeredByEmployeeName: r.answeredByEmployeeName,
        channel: r.channel,
        durationSeconds: r.durationSeconds,
        status: r.status,
        notes: r.notes,
        timestamp: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      }));
      return res.status(200).json({ callLogs: formatted, source: 'neon' });
    }

    if (req.method === 'POST') {
      const { 
        id, 
        customerName, 
        customerPhone, 
        answeredByEmployeeId, 
        answeredByEmployeeName, 
        channel, 
        durationSeconds, 
        status, 
        notes 
      } = req.body;

      const callId = id || `call-${Date.now()}`;
      const cName = customerName || 'Unknown Customer';
      const cPhone = customerPhone || 'Unknown Phone';
      const ch = channel || 'sim';
      const dur = durationSeconds || 0;
      const st = status || 'answered';
      const n = notes || '';

      await sql`
        INSERT INTO customer_call_logs (
          id, customer_name, customer_phone, answered_by_employee_id, 
          answered_by_employee_name, channel, duration_seconds, status, notes
        )
        VALUES (
          ${callId}, ${cName}, ${cPhone}, ${answeredByEmployeeId || null}, 
          ${answeredByEmployeeName || null}, ${ch}, ${dur}, ${st}, ${n}
        );
      `;

      if (answeredByEmployeeId) {
        await sql`
          UPDATE company_employees
          SET total_calls_answered = total_calls_answered + 1
          WHERE id = ${answeredByEmployeeId};
        `;
      }

      return res.status(200).json({ success: true, id: callId });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (id) {
        await sql`DELETE FROM customer_call_logs WHERE id = ${id};`;
        return res.status(200).json({ success: true, message: 'Call log deleted', deletedId: id });
      }
      await sql`DELETE FROM customer_call_logs;`;
      return res.status(200).json({ success: true, message: 'All call logs cleared' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API /api/calls error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
