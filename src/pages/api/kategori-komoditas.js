import pool from '../../lib/db';

export default async function handler(req, res) {
  try {
    const result = await pool.query(`
      SELECT DISTINCT komoditas_nama
      FROM v_komoditas_titikpasar
      ORDER BY komoditas_nama
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
}

