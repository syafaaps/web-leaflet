import pool from '../../lib/db';

export default async function handler(req, res) {
  try {
    const result = await pool.query(`
      SELECT DISTINCT komoditas_nama
      FROM komoditas
      ORDER BY komoditas_nama
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}