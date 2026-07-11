import pool from '../../lib/db';

export default async function handler(req, res) {
  res.setHeader(
    'Cache-Control',
    's-maxage=600, stale-while-revalidate=60'
  );

  const { komoditas, tanggal, summary } = req.query;

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

    const isSummary = summary === 'true';

    const selectCols = isSummary
      ? `kabupaten, ROUND(rata_kabupaten::numeric, 0) AS rata_kabupaten`
      : `uid, kabupaten, tanggal::text, komoditas_nama, ROUND(rata_kabupaten::numeric, 0) AS rata_kabupaten, ST_AsGeoJSON(geom)::json AS geojson`;

    const result = await pool.query(
      `
      SELECT ${selectCols}
      FROM v_heatmap_kabkot
      ${whereClause}
      ${isSummary ? 'ORDER BY rata_kabupaten DESC LIMIT 50' : 'ORDER BY kabupaten'}
    `,
      params
    );

    let rataProvinsi = 0;

    if (komoditas) {
      const tanggalCari = tanggal
        ? tanggal
        : result.rows[0]?.tanggal;

      if (tanggalCari) {
        const avgResult = await pool.query(
          `
          SELECT harga
          FROM "komoditas_rata-rata"
          WHERE tanggal = $1
            AND komoditas_nama = $2
          `,
          [tanggalCari, komoditas]
        );

        rataProvinsi = avgResult.rows[0]?.harga || 0;
      }
    }

    if (isSummary) {
      const features = result.rows.map((row) => ({
        type: 'Feature',
        properties: {
          kabupaten: row.kabupaten,
          rata_kabupaten: row.rata_kabupaten,
        },
      }));

      return res.status(200).json({
        type: 'FeatureCollection',
        features,
        rata_provinsi: rataProvinsi,
      });
    }

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
      rata_provinsi: rataProvinsi,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
}
