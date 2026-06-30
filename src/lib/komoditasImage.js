/**
 * Mapping nama komoditas (dari database) ke nama file gambar di /public/image/
 * Kunci: substring atau kata kunci dari komoditas_nama (case-insensitive lookup)
 */
const KOMODITAS_IMAGE_MAP = [
  // Beras
  { keywords: ['beras premium', 'beras medium'], file: 'Beras.jpeg' },
  // Jagung
  { keywords: ['jagung pipilan kering'], file: 'Jagung.jpeg' },
  // Bawang
  { keywords: ['bawang merah'], file: 'BawangMerah.jpeg' },
  { keywords: ['bawang putih sinco/honan', 'bawang putih'], file: 'BawahPutih.jpeg' },
  // Cabai
  { keywords: ['cabe merah besar'], file: 'CabeMerah.jpeg' },
  { keywords: ['cabe merah keriting'], file: 'CabeKeriting.jpeg' },
  { keywords: ['cabe rawit merah'], file: 'CabeRawit.jpg' },

  // Sayuran
  { keywords: ['tomat merah'], file: 'Tomat.jpeg' },
  { keywords: ['kentang'], file: 'Kentang.jpeg' },
  { keywords: ['kol/kubis'], file: 'Kubis.jpeg' },
  { keywords: ['buncis'], file: 'Buncis.jpeg' },
  { keywords: ['wortel'], file: 'Wortel.jpeg' },
  // Daging & Telur
  { keywords: ['daging ayam kampung'], file: 'Ayam.jpeg' },
  { keywords: ['daging ayam ras'], file: 'AyamUtuh.jpeg' },
  { keywords: ['daging sapi paha belakang'], file: 'SapiPaha.jpeg' },
  { keywords: ['telur ayam kampung'], file: 'TelurKampung.jpeg' },
  { keywords: ['telur ayam ras'], file: 'Telur.jpeg' },
  // Pangan Lainnya
  { keywords: ['gula kristal putih'], file: 'Gula.jpeg' },
  { keywords: ['kedelai lokal'], file: 'Kedelai.jpeg' },
  { keywords: ['terigu protein sedang (kemasan)'], file: 'Tepung.jpeg' },
  { keywords: ['minyak goreng curah'], file: 'MinyakCurah.jpeg' },
  { keywords: ['minyak goreng kemasan sederhana', 'minyak goreng kemasan premium', 'minyak goreng minyakita'], file: 'MinyakKita.jpeg' },
];

/**
 * Cari URL gambar berdasarkan nama komoditas.
 * @param {string} komoditasNama
 * @returns {string|null} path gambar, misal "/image/Beras.jpeg", atau null kalau tidak ada
 */
export function getKomoditasImageUrl(komoditasNama) {
  if (!komoditasNama) return null;
  const lower = komoditasNama.toLowerCase().trim();

  for (const entry of KOMODITAS_IMAGE_MAP) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return `/image/${entry.file}`;
      }
    }
  }

  return null;
}
