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
console.time('pasarQuery');

    const result = await pool.query(
`
SELECT
    p.id AS uid,
    p.psr_nama AS nama_pasar,
    kk.kab_nama AS kabupaten,
    ST_X(p.geom) AS longitude,
    ST_Y(p.geom) AS latitude,
    k.tanggal::text,
    k.komoditas_nama,
    k.harga,
    r.harga AS rata_prov,
    k.harga - r.harga AS deviasi,
    ROUND(
      (k.harga-r.harga)::numeric * 100 /
      NULLIF(r.harga,0),
      2
    ) AS persen_deviasi,
    CASE
      WHEN (k.harga-r.harga)::numeric / NULLIF(r.harga,0) > 0.05
        THEN 'Di Atas Rata-rata'
      WHEN (k.harga-r.harga)::numeric / NULLIF(r.harga,0) < -0.05
        THEN 'Di Bawah Rata-rata'
      ELSE 'Rata-rata'
    END AS kategori
FROM komoditas k
JOIN pasar p
    ON k.pasar_id = p.id
JOIN kab_kota kk
    ON p.kabkota_id = kk.id
JOIN provinsi pr
    ON kk.provinsi_id = pr.id_provinsi
JOIN "komoditas_rata-rata" r
    ON k.tanggal = r.tanggal
   AND k.komoditas_nama = r.komoditas_nama
WHERE
    k.komoditas_nama = $1
    AND k.tanggal = $2
    AND pr.nama = 'Jawa Timur'
    AND k.harga IS NOT NULL
    AND k.harga > 0
ORDER BY
    kk.kab_nama,
    p.psr_nama
`,
[komoditas, tanggal]
);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
}

