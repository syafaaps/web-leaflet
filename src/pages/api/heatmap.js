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
          FROM v_heatmap_kabkot
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
        kabupaten,
        tanggal::text,
        komoditas_nama,
        ROUND(rata_kabupaten::numeric,0) AS rata_kabupaten,
        ST_AsGeoJSON(geom)::json AS geojson
      FROM v_heatmap_kabkot
      ${whereClause}
      ORDER BY kabupaten
    `,
      params
    );

    const features = result.rows
      .filter((row) => row.geojson)
      .map((row) => ({
        type: 'Feature',
        geometry: row.geojson,
        properties: {
          uid: row.uid,
          kabupaten: row.kabupaten,
          tanggal: row.tanggal,
          komoditas_nama: row.komoditas_nama,
          rata_kabupaten: row.rata_kabupaten,
        },
      }));

    res.status(200).json({
      type: 'FeatureCollection',
      features,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
}
