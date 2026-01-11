import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rows } = await sql`SELECT payload FROM responses ORDER BY created_at ASC;`;
    const payloads = rows.map((row) => row.payload);
    return res.status(200).json(payloads);
  } catch (error) {
    console.error('Fetch failed', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
