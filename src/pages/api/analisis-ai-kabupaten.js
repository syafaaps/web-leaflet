import pool from '../../lib/db';

export default async function handler(req, res) {
  try {
    const {
      kabupaten,
      komoditas,
      tanggal,
    } = req.body;

    // Rata-rata harga kabupaten ini
    const kabResult = await pool.query(
      `
      SELECT rata_kabupaten
      FROM v_avg_kabkot
      WHERE kabupaten = $1
        AND komoditas_nama = $2
        AND tanggal = $3
      LIMIT 1
      `,
      [kabupaten, komoditas, tanggal]
    );

    const rataKabupaten = Number(kabResult.rows[0]?.rata_kabupaten) || 0;

    // Rata-rata provinsi
    const provResult = await pool.query(
      `
      SELECT harga
      FROM "komoditas_rata-rata"
      WHERE komoditas_nama = $1
        AND tanggal = $2
      LIMIT 1
      `,
      [komoditas, tanggal]
    );

    const rataProvinsi = Number(provResult.rows[0]?.harga) || 0;

    // Semua pasar dalam kabupaten ini beserta harganya
    const pasarResult = await pool.query(
      `
      SELECT
          p.psr_nama,
          k.harga
      FROM komoditas k
      JOIN pasar p ON p.id = k.pasar_id
      JOIN kab_kota kk ON p.kabkota_id = kk.id
      WHERE
          kk.kab_nama = $1
          AND k.komoditas_nama = $2
          AND k.tanggal = $3
      ORDER BY k.harga DESC
      `,
      [kabupaten, komoditas, tanggal]
    );

    const dataPasar = pasarResult.rows;

    // Ranking kabupaten di antara seluruh kabupaten/kota
    const rankResult = await pool.query(
      `
      SELECT kabupaten,
             rata_kabupaten,
             RANK() OVER (ORDER BY rata_kabupaten DESC) AS rank
      FROM v_avg_kabkot
      WHERE komoditas_nama = $1
        AND tanggal = $2
      ORDER BY rata_kabupaten DESC
      `,
      [komoditas, tanggal]
    );

    const rankRow = rankResult.rows.find(r => r.kabupaten === kabupaten);
    const rankKabupaten = rankRow ? Number(rankRow.rank) : null;
    const totalKabupaten = rankResult.rows.length;

    console.log('KIRIM KE N8N (AI Kabupaten)');

    const response = await fetch(
      'http://192.168.60.24:5678/webhook/ai-pasar',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaPasar: null,
          kabupaten,
          komoditas,
          tanggal,
          hargaPasar: rataKabupaten,
          rataKabupaten,
          rataProvinsi,
          rankKabupaten,
          totalKabupaten,
          dataPasarKabupaten: dataPasar,
        }),
      }
    );

    const result = await response.json();

    return res.status(200).json({
      analisis:
        result.analisis ||
        result.output ||
        result[0]?.output ||
        'Tidak ada analisis',
      rataKabupaten,
      rataProvinsi,
      rankKabupaten,
      totalKabupaten,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
