import pool from '../../lib/db';

export default async function handler(req, res) {
  try {
    const result = await pool.query('SELECT 1');
    res.status(200).json({ success: true, result: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
