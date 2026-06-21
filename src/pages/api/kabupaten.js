import pool from '../../lib/db';

export default async function handler(req, res) {
  try {
    const result = await pool.query(`
      SELECT kk.kab_nama
      FROM kab_kota kk
      JOIN provinsi p
        ON kk.provinsi_id = p.id_provinsi
      WHERE p.nama = 'Jawa Timur'
      ORDER BY kk.kab_nama
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
}