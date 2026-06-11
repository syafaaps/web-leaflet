import pool from '../../lib/db';

export default async function handler(req, res) {
  res.setHeader(
    'Cache-Control',
    's-maxage=600, stale-while-revalidate=60'
  );

  const { komoditas, tanggal } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (komoditas) {
      params.push(komoditas);
      conditions.push(`komoditas_nama = $${params.length}`);
    }

    if (tanggal) {
      params.push(tanggal);
      conditions.push(`tanggal = $${params.length}`);
    } else {
      conditions.push(`
        tanggal = (
          SELECT MAX(tanggal)
          FROM v_komoditas_titikpasar
        )
      `);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const result = await pool.query(
      `
      SELECT
        uid,
        nama_pasar,
        kabupaten,
        ST_X(geom) AS longitude,
        ST_Y(geom) AS latitude,
        tanggal::text,
        komoditas_nama,
        harga,
        rata_prov,
        deviasi,
        persen_deviasi,
        kategori
      FROM v_komoditas_titikpasar
      ${whereClause}
      ORDER BY kabupaten,nama_pasar
    `,
      params
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
}

