// pages/heatmap.js
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';

const LeafletHeatmapWrapper = dynamic(
  () => import('@components/Map/LeafletHeatmapWrapper'),
  { ssr: false }
);

// ── Warna gradient legend ────────────────────────────────────────────────────
function computeRange(features) {
  if (!features?.length) return { min: 0, max: 1 };
  const prices = features
    .map(f => Number(f.properties.rata_kabupaten))
    .filter(v => !isNaN(v) && v > 0);
  return prices.length
    ? { min: Math.min(...prices), max: Math.max(...prices) }
    : { min: 0, max: 1 };
}

function formatRp(val) {
  return val ? `Rp ${Number(val).toLocaleString('id-ID')}` : '–';
}

// ── Ranking kabupaten ────────────────────────────────────────────────────────
function getRanking(features) {
  return [...features]
    .filter(f => f.properties.rata_kabupaten > 0)
    .sort((a, b) => b.properties.rata_kabupaten - a.properties.rata_kabupaten);
}

export default function HeatmapPage() {
  const [geojsonData,     setGeojsonData]     = useState(null);
  const [komoditasList,   setKomoditasList]   = useState([]);
  const [selectedKom,     setSelectedKom]     = useState('');
  const [selectedDate,    setSelectedDate]    = useState('');
  const [loading,         setLoading]         = useState(false);
  const [hoveredKab,      setHoveredKab]      = useState(null);
  const [selectedKab,     setSelectedKab]     = useState(null);
  const [showRanking,     setShowRanking]     = useState(false);

  // Fetch komoditas
//   useEffect(() => {
//     fetch('/api/kategori-komoditas')
//       .then(r => r.json())
//       .then(data => {
//         setKomoditasList(data);
//         if (data.length) setSelectedKom(data[0].kategori);
//       })
//       .catch(console.error);
//   }, []);
//   useEffect(() => {
//     fetch('/api/heatmap')
//       .then(r => r.json())
//       .then(data => {
//         setKomoditasList(data);
//         if (data.length) setSelectedKom(data[0].komoditas_nama);
//       })
//       .catch(console.error);
//   }, []);
  useEffect(() => {
  fetch('/api/komoditas')
    .then(r => r.json())
    .then(data => {
      const komoditas = [
        ...new Set(
          (data.features || []).map(f => f.properties.komoditas_nama)
        )
      ].filter(Boolean);

      const formatted = komoditas.map(k => ({
        komoditas_nama: k,
        kategori: k // biar UI kamu tetap pakai label lama
      }));

      setKomoditasList(formatted);

      if (formatted.length) {
        setSelectedKom(formatted[0].komoditas_nama);
      }
    })
    .catch(console.error);
}, []);

  // Fetch heatmap GeoJSON
  const fetchHeatmap = useCallback(() => {
    if (!selectedKom) return;
    setLoading(true);
    const p = new URLSearchParams();
    p.set('komoditas', selectedKom);
    if (selectedDate) p.set('tanggal', selectedDate);

    fetch(`/api/heatmap?${p}`)
      .then(r => r.json())
      .then(data => { setGeojsonData(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [selectedKom, selectedDate]);

  useEffect(() => { fetchHeatmap(); }, [fetchHeatmap]);

  const { min, max } = geojsonData?.features
    ? computeRange(geojsonData.features)
    : { min: 0, max: 1 };

  const ranking = geojsonData?.features ? getRanking(geojsonData.features) : [];

  const activeInfo = selectedKab || hoveredKab;

  return (
    <>
      <Head>
        <title>Heatmap Harga — Jawa Timur</title>
        <meta name="description" content="Peta sebaran harga komoditas per kabupaten/kota Jawa Timur" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *{box-sizing:border-box;margin:0;padding:0}
        :root{
          --green-dark:#0f4c35;
          --green-mid:#1a7a52;
          --green-light:#d4edda;
          --bg:#f0f4f1;
          --surface:#ffffff;
          --border:#e0e8e3;
          --text-primary:#0f2318;
          --text-secondary:#4a6358;
          --text-muted:#8aaa98;
          --shadow-sm:0 1px 4px rgba(15,76,53,.07);
          --shadow-md:0 4px 20px rgba(15,76,53,.11);
          --radius:12px;
          --sidebar:320px;
        }
        html,body,#__next{height:100%}
        body{
          font-family:'DM Sans',system-ui,sans-serif;
          background:var(--bg);
          color:var(--text-primary);
        }
        select,input,button{font-family:inherit}
        .leaflet-tooltip{
          border:none!important;
          box-shadow:0 4px 16px rgba(0,0,0,.13)!important;
          border-radius:8px!important;
          padding:8px 10px!important;
        }
      `}</style>

      {/* ── LAYOUT UTAMA ── */}
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* ── SIDEBAR KIRI ── */}
        <aside style={{
          width: 'var(--sidebar)',
          flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 10,
        }}>
          {/* Header sidebar */}
          <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--border)' }}>
            {/* Breadcrumb / nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Link href="/" style={{
                fontSize: '11px', fontWeight: 600, color: 'var(--green-mid)',
                textDecoration: 'none', letterSpacing: '.05em', textTransform: 'uppercase'
              }}>
                ← Pasar
              </Link>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>/</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Heatmap
              </span>
            </div>

            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 800,
              color: 'var(--green-dark)', lineHeight: 1.1, marginBottom: '4px',
            }}>
              Peta Harga<br />Kabupaten / Kota
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Rata-rata harga komoditas per wilayah
            </p>
          </div>

          {/* Filter */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Komoditas */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>
                Komoditas
              </label>
              <select
                value={selectedKom}
                onChange={e => setSelectedKom(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: '8px',
                  border: '1px solid var(--border)', fontSize: '13px',
                  color: 'var(--text-primary)', background: 'var(--bg)',
                  outline: 'none', cursor: 'pointer', fontWeight: 500,
                }}
              >
                {komoditasList.length === 0
                  ? <option>Memuat…</option>
                  : komoditasList.map((k, i) => (
                      <option key={i} value={k.komoditas_nama}>
                        {k.kategori}
                    </option>
                    ))
                }
              </select>
            </div>

            {/* Tanggal */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>
                Tanggal
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: '8px',
                  border: '1px solid var(--border)', fontSize: '13px',
                  color: 'var(--text-primary)', background: 'var(--bg)',
                  outline: 'none', fontWeight: 500,
                }}
              />
            </div>
          </div>

          {/* Info kabupaten (hover / klik) */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            minHeight: '120px',
            background: activeInfo ? 'var(--bg)' : 'transparent',
            transition: 'background .2s',
          }}>
            {activeInfo ? (
              <>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '8px' }}>
                  {selectedKab ? '📍 Dipilih' : '🖱 Hover'}
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '17px', fontWeight: 800, color: 'var(--green-dark)', marginBottom: '2px' }}>
                  {activeInfo.kabupaten}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {activeInfo.komoditas_nama} · {activeInfo.tanggal}
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f4c35', letterSpacing: '-1px', lineHeight: 1 }}>
                  {formatRp(activeInfo.rata_kabupaten)}
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', paddingTop: '8px' }}>
                Arahkan kursor ke wilayah untuk melihat harga
              </div>
            )}
          </div>

          {/* Legend gradient */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '8px' }}>
              Skala Harga
            </div>
            <div style={{
              height: '10px', borderRadius: '5px', marginBottom: '6px',
              background: 'linear-gradient(to right, #22c55e, #f97316, #ef4444)',
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              <span style={{ color: '#15803d' }}>Murah — {formatRp(min)}</span>
              <span style={{ color: '#b91c1c' }}>Mahal — {formatRp(max)}</span>
            </div>
          </div>

          {/* Ranking kabupaten */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <button
              onClick={() => setShowRanking(v => !v)}
              style={{
                width: '100%', padding: '12px 16px',
                border: 'none', background: 'transparent',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span>Ranking Harga ({ranking.length} wilayah)</span>
              <span style={{ fontSize: '12px' }}>{showRanking ? '▲' : '▼'}</span>
            </button>

            {showRanking && (
              <div style={{ overflow: 'auto', flex: 1, padding: '8px 0' }}>
                {ranking.map((f, i) => {
                  const val = Number(f.properties.rata_kabupaten);
                  const { min: rMin, max: rMax } = { min, max };
                  const ratio = rMax === rMin ? 0 : (val - rMin) / (rMax - rMin);
                  const barColor = ratio < 0.33 ? '#22c55e' : ratio < 0.66 ? '#f97316' : '#ef4444';

                  return (
                    <div
                      key={f.properties.uid || i}
                      onClick={() => setSelectedKab(selectedKab?.kabupaten === f.properties.kabupaten ? null : f.properties)}
                      style={{
                        padding: '8px 16px', cursor: 'pointer',
                        background: selectedKab?.kabupaten === f.properties.kabupaten ? 'var(--green-light)' : 'transparent',
                        transition: 'background .15s',
                        display: 'flex', alignItems: 'center', gap: '10px',
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '18px', textAlign: 'right' }}>
                        {i + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                          {f.properties.kabupaten}
                        </div>
                        <div style={{ height: '4px', borderRadius: '2px', background: '#e5e7eb', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${ratio * 100}%`, background: barColor, borderRadius: '2px', transition: 'width .3s' }} />
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: barColor, whiteSpace: 'nowrap' }}>
                        {formatRp(val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ── AREA PETA ── */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Loading overlay */}
          {loading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1001,
              background: 'rgba(240,244,241,.7)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                background: 'white', padding: '14px 22px', borderRadius: '10px',
                border: '1px solid var(--border)', fontSize: '13px', fontWeight: 600,
                color: 'var(--green-mid)', boxShadow: 'var(--shadow-md)',
              }}>
                ⏳ Memuat data peta…
              </div>
            </div>
          )}

          {/* Badge info atas */}
          <div style={{
            position: 'absolute', top: 14, right: 14, zIndex: 1000,
            background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(6px)',
            padding: '8px 14px', borderRadius: '10px',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
            fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500,
          }}>
            <span style={{ fontWeight: 700, color: 'var(--green-dark)' }}>
              {selectedKom || '–'}
            </span>
            {' · '}
            {selectedDate || 'Tanggal terbaru'}
            {' · '}
            <span style={{ color: 'var(--green-mid)' }}>
              {geojsonData?.features?.length || 0} kab/kota
            </span>
          </div>

          {/* Peta */}
          <LeafletHeatmapWrapper
            geojsonData={geojsonData}
            onHover={setHoveredKab}
            onClick={(props) => setSelectedKab(prev =>
              prev?.kabupaten === props.kabupaten ? null : props
            )}
          />
        </main>
      </div>
    </>
  );
}