import pool from '../../lib/db';

export default async function handler(req, res) {

  try {

    const {
      komoditas,
      tanggal
    } = req.body;

    const provResult = await pool.query(
    `
    SELECT harga
    FROM "komoditas_rata-rata"
    WHERE
    komoditas_nama = $1
    AND tanggal = $2
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

    console.log(
      "RATA PROVINSI =",
      rataProvinsi
    );

    const mahalResult = await pool.query(
    `
    SELECT
    kabupaten,
    rata_kabupaten
    FROM v_avg_kabkot
    WHERE
    komoditas_nama = $1
    AND tanggal = $2
    ORDER BY rata_kabupaten DESC
    LIMIT 3
    `,
    [
      komoditas,
      tanggal
    ]
    );

    console.log(
      "TOP 3 MAHAL =",
      mahalResult.rows
    );

    const murahResult = await pool.query(
    `
    SELECT
    kabupaten,
    rata_kabupaten
    FROM v_avg_kabkot
    WHERE
    komoditas_nama = $1
    AND tanggal = $2
    ORDER BY rata_kabupaten ASC
    LIMIT 3
    `,
    [
      komoditas,
      tanggal
    ]
    );

    console.log(
      "TOP 3 MURAH =",
      murahResult.rows
    );

    const statResult = await pool.query(
    `
    SELECT
    MAX(rata_kabupaten) AS harga_max,
    MIN(rata_kabupaten) AS harga_min
    FROM v_avg_kabkot
    WHERE
    komoditas_nama = $1
    AND tanggal = $2
    `,
    [
      komoditas,
      tanggal
    ]
    );

    const hargaMax =
    Number(
      statResult.rows[0]?.harga_max
    ) || 0;

    const hargaMin =
    Number(
      statResult.rows[0]?.harga_min
    ) || 0;

    const rentangHarga =
    hargaMax - hargaMin;


    console.log(
      "MAX =",
      hargaMax
    );

    console.log(
      "MIN =",
      hargaMin
    );

    console.log(
      "RENTANG =",
      rentangHarga
    );

    const jumlahResult = await pool.query(
`
SELECT

SUM(
CASE
WHEN rata_kabupaten > $3
THEN 1
ELSE 0
END
) AS jumlah_atas,

SUM(
CASE
WHEN rata_kabupaten < $3
THEN 1
ELSE 0
END
) AS jumlah_bawah

FROM v_avg_kabkot
WHERE
komoditas_nama = $1
AND tanggal = $2
`,
[
  komoditas,
  tanggal,
  rataProvinsi
]
);

const jumlahAtas =
Number(
  jumlahResult.rows[0]?.jumlah_atas
) || 0;

const jumlahBawah =
Number(
  jumlahResult.rows[0]?.jumlah_bawah
) || 0;

console.log(
  "JUMLAH ATAS =",
  jumlahAtas
);

console.log(
  "JUMLAH BAWAH =",
  jumlahBawah
);

console.log("KIRIM KE N8N");

const response = await fetch(
  "http://192.168.60.24:5678/webhook/ai-provinsi",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({

      komoditas,
      tanggal,

      rataProvinsi,

      topMahal: mahalResult.rows,

      topMurah: murahResult.rows,

      hargaMax,
      hargaMin,

      rentangHarga,

      jumlahAtas,
      jumlahBawah

    })
  }
);

console.log("SUDAH FETCH");

const result = await response.json();

console.log(
  "HASIL DARI N8N =",
  JSON.stringify(result, null, 2)
);

    console.log("KOMODITAS =", komoditas);
    console.log("TANGGAL =", tanggal);

return res.status(200).json({

  analisis:
    result.analisis ||
    result.output ||
    "Tidak ada analisis"

});

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

}