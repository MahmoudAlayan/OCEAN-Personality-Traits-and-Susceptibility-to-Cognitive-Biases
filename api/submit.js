import { sql } from '@vercel/postgres';

const ensureTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS responses (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      payload JSONB NOT NULL
    );
  `;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!payload || !payload.demographics || !payload.demographics.age) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    await ensureTable();
    await sql`INSERT INTO responses (payload) VALUES (${JSON.stringify(payload)}::jsonb);`;

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Submit failed', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
