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

// import pool from '../../lib/db';

// export default async function handler(req, res) {
//   try {
//     const result = await pool.query(`
//       SELECT DISTINCT kategori
//       FROM kategori_komoditas
//       ORDER BY kategori ASC
//       LIMIT 100
//     `);

//     res.status(200).json(result.rows);
//   } catch (error) {
//     console.error('Error fetching kategori komoditas:', error);
//     res.status(500).json({ error: error.message });
//   }
// }
// // import pool from '../../lib/db';

// // export default async function handler(req, res) {
// //   try {
// //     const result = await pool.query(`
// //       SELECT 
// //         kategori
// //       FROM kategori_komoditas
// //       LIMIT 100
// //     `);

// //     res.status(200).json(result.rows);
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ error: error.message });
// //   }
// // }