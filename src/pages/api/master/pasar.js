import pool from '../../../lib/db';

export default async function handler(req, res) {
  try {
    const { kabkota_id } = req.query;
    let query = `SELECT id, psr_nama AS nama FROM pasar`;
    const params = [];
    if (kabkota_id) {
      params.push(kabkota_id);
      query += ` WHERE kabkota_id = $1`;
    }
    query += ` ORDER BY psr_nama`;
    const result = await pool.query(query, params);
    res.status(200).json({ status: "success", data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
