// components/MapDashboard/modes/WilayahMode.js
// ═══════════════════════════════════════════════════════════════
// TEMPLATE — Contoh cara tambah mode baru
// 
// Cara daftar:
//   1. Buat file ini (sesuaikan logika)
//   2. Di DashboardShell.js tambahkan:
//        import WilayahMode from './modes/WilayahMode';
//        { id: 'wilayah', label: 'Kecamatan', icon: '📍', desc: 'By kecamatan', component: WilayahMode }
//      ke array MODES
// ═══════════════════════════════════════════════════════════════

// Props yang selalu diterima dari DashboardShell:
//   selectedDate : string  (format 'YYYY-MM-DD' atau '')
//   selectedKoms : string[] (array nama komoditas)

export default function WilayahMode({ selectedDate, selectedKoms }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '12px',
      background: '#f0f4f1', color: '#4a6358',
    }}>
      <div style={{ fontSize: '40px' }}>🗺️</div>
      <div style={{ fontWeight: 700, fontSize: '16px' }}>Mode Kecamatan</div>
      <div style={{ fontSize: '13px', color: '#8aaa98', textAlign: 'center', maxWidth: '300px' }}>
        Implementasikan komponen peta kamu di sini.<br />
        Komoditas: {selectedKoms?.join(', ') || '–'}<br />
        Tanggal: {selectedDate || 'terbaru'}
      </div>
    </div>
  );
}