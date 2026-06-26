import pool from '../../lib/db';

export default async function handler(req, res) {
  try {

    

    const {
      namaPasar,
      kabupaten,
      komoditas,
      harga,
      tanggal
    } = req.body;

  

    const kabResult = await pool.query(
    `
    SELECT rata_kabupaten
    FROM v_avg_kabkot
    WHERE
    kabupaten = $1
    AND komoditas_nama = $2
    AND tanggal = $3
    LIMIT 1
    `,
    [
      kabupaten,
      komoditas,
      tanggal
    ]
    );

    const rataKabupaten =
    Number(
      kabResult.rows[0]?.rata_kabupaten
    ) || 0;

    const provResult = await pool.query(
    `
    SELECT harga
    FROM "komoditas_rata-rata"
    WHERE
    komoditas_nama=$1
    AND tanggal=$2
    LIMIT 1
    `,
    [
      komoditas,
      tanggal
    ]
    );

    const rataProvinsi =
    Number(
      provResult.rows[0]?.harga
    ) || 0;

    // const nearestResult = await pool.query(
    // `
    // SELECT
    //     p2.psr_nama,
    //     ROUND(
    //         (
    //             ST_Distance(
    //                 p1.geom::geography,
    //                 p2.geom::geography
    //             ) / 1000
    //         )::numeric,
    //         2
    //     ) AS jarak_km
    // FROM pasar p1
    // JOIN pasar p2
    // ON p1.id <> p2.id
    // WHERE p1.psr_nama = $1
    // ORDER BY p2.geom <-> p1.geom
    // LIMIT 1
    //     `,
    // [
    //   namaPasar
    // ]
    // );

    // const pasarTerdekat =
    // nearestResult.rows[0]?.psr_nama || '';

    // const jarakKm =
    // Number(
    // nearestResult.rows[0]?.jarak_km
    // ).toFixed(2);

    // const hargaTerdekatResult = await pool.query(
    // `
    // SELECT
    // k.harga
    // FROM komoditas k
    // JOIN pasar p
    // ON k.pasar_id = p.id

    // WHERE
    // p.psr_nama = $1
    // AND k.komoditas_nama = $2
    // AND k.tanggal = $3

    // LIMIT 1
    // `,
    // [
    //   pasarTerdekat,
    //   komoditas,
    //   tanggal
    // ]
    // );

    // const hargaPasarTerdekat =
    // Number(
    // hargaTerdekatResult.rows[0]?.harga
    // ) || 0;

    // let selisihPersen = 0;

    // if (hargaPasarTerdekat > 0) {
    //   selisihPersen =
    //     (
    //       (harga - hargaPasarTerdekat)
    //       / hargaPasarTerdekat
    //     ) * 100;
    // }

    // selisihPersen =
    // Number(
    //   selisihPersen.toFixed(2)
    // );

    const dataPasarResult = await pool.query(
    `
    SELECT
        p.psr_nama,
        k.harga
    FROM komoditas k
    JOIN pasar p
        ON p.id = k.pasar_id
    JOIN kab_kota kk
        ON p.kabkota_id = kk.id
    WHERE
        kk.kab_nama = $1
        AND k.komoditas_nama = $2
        AND k.tanggal = $3
    ORDER BY k.harga DESC
    `,
    [
        kabupaten,
        komoditas,
        tanggal
    ]
    );

    const dataPasarKabupaten = dataPasarResult.rows;

    console.log(
  "DATA PASAR KABUPATEN =",
  JSON.stringify(dataPasarKabupaten, null, 2)
);

    // console.log(
    // 'PASAR TERDEKAT =',
    // pasarTerdekat
    // );

    //     console.log(
    // 'JARAK =',
    // jarakKm,
    // 'km'
    // );

    // console.log(
    // 'HARGA PASAR TERDEKAT =',
    // hargaPasarTerdekat
    // );

    //   console.log(
    //   'SELISIH HARGA =',
    //   selisihPersen,
    //   '%'
    //   );
    //   const selisihAbsolut =
    // Math.abs(selisihPersen);

    // console.log(
    // 'SELISIH ABSOLUT =',
    // selisihAbsolut
    // );

    console.log(
    "RATA PROVINSI =",
    rataProvinsi
    );

    console.log(
    "RATA KABUPATEN =",
    rataKabupaten
    );

  console.log("KIRIM KE N8N");
  const response = await fetch(
    "http://192.168.60.24:5678/webhook/ai-pasar",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      namaPasar,
      kabupaten,
      komoditas,
      tanggal,

      hargaPasar: harga,

      rataKabupaten,
      rataProvinsi,

      // pasarTerdekat,
      // jarakKm,
      // hargaPasarTerdekat,

      // selisihPersen,
      // selisihAbsolut,
      dataPasarKabupaten
    }),
  });
  console.log("SUDAH FETCH");

const result = await response.json();

console.log(
  "HASIL DARI N8N:",
  JSON.stringify(result, null, 2)
);

console.log(
  "ISI AI ANALYSIS =",
  result.analisis
);

return res.status(200).json({
  analisis:
    result.analisis ||
    result.output ||
    'Tidak ada analisis'
});

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
}