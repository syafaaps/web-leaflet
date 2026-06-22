import pool from '../../lib/db';

export default async function handler(req, res) {
  try {

    const result = await pool.query(`
  SELECT DISTINCT komoditas_nama
  FROM komoditas
  WHERE komoditas_nama = ANY (
    ARRAY[
      'Beras Premium',
      'Beras Medium',
      'Gula Kristal Putih',
      'Telur Ayam Ras',
      'Telur Ayam Kampung',
      'Daging Ayam Ras',
      'Daging Ayam Kampung',
      'Daging Sapi Paha Belakang',
      'Jagung Pipilan Kering',
      'Kedelai Lokal',
      'Terigu Protein Sedang (Kemasan)',
      'Cabe Merah Keriting',
      'Cabe Merah Besar',
      'Cabe Rawit Merah',
      'Bawang Merah',
      'Bawang Putih Sinco/Honan',
      'KENTANG',
      'KOL/KUBIS',
      'Tomat Merah',
      'WORTEL',
      'BUNCIS',
      'Minyak Goreng Kemasan Premium',
      'Minyak Goreng Kemasan Sederhana',
      'Minyak Goreng Curah',
      'Minyak Goreng MINYAKITA'
    ]
  )
  ORDER BY komoditas_nama
`);

    res.status(200).json(result.rows);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
}