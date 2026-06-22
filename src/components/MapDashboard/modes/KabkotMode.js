// components/MapDashboard/modes/KabkotMode.js
// Mode: choropleth harga rata-rata per kabupaten/kota
// Menerima props: selectedDate, selectedKoms (array)
// Kalau selectedKoms > 1, ambil komoditas pertama (choropleth 1 layer)

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

const LeafletHeatmapMap = dynamic(
  () => import('../../Map/LeafletHeatmapMap'),
  { ssr: false, loading: () => <MapLoading /> }
);

function MapLoading() {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f0f4f1', color: '#4a6358', fontSize: '13px',
    }}>
      Memuat peta…
    </div>
  );
}

function formatRp(v) {
  return v != null && v > 0 ? `Rp ${Number(v).toLocaleString('id-ID')}` : '–';
}

function computeRange(features) {
  const prices = (features || [])
    .map(f => Number(f.properties.rata_kabupaten))
    .filter(v => !isNaN(v) && v > 0);
  return prices.length
    ? { min: Math.min(...prices), max: Math.max(...prices) }
    : { min: 0, max: 1 };
}

function getRanking(features) {
  return [...(features || [])]
    .filter(f => f.properties.rata_kabupaten > 0)
    .sort((a, b) => b.properties.rata_kabupaten - a.properties.rata_kabupaten);
}

export default function KabkotMode({ selectedDate, selectedKoms }) {
  const [geojsonData,  setGeojsonData]  = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [hoveredKab,   setHoveredKab]   = useState(null);
  const [selectedKab,  setSelectedKab]  = useState(null);
  const [rankOpen,     setRankOpen]     = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  // Pakai komoditas pertama yang dipilih
  const activeKom = selectedKoms?.[0] ?? '';

  const fetchData = useCallback(() => {
    if (!activeKom) { setGeojsonData(null); return; }
    setLoading(true);
    const p = new URLSearchParams({ komoditas: activeKom });
    if (selectedDate) p.set('tanggal', selectedDate);

    fetch(`/api/heatmap?${p}`)
      .then(r => r.json())
      .then(data => { setGeojsonData(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [activeKom, selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {

  if (!activeKom) return;

  getAiAnalysis();

  }, [activeKom, selectedDate]);
const getAiAnalysis = async () => {

  try {

    setLoadingAI(true);

    setAiAnalysis('');

    const response = await fetch(
      '/api/analisis-ai-provinsi',
      {
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },

        body: JSON.stringify({
          komoditas: activeKom,
          tanggal: selectedDate
        })
      }
    );

    const result = await response.json();

    console.log(
      "RESULT DARI API:",
      JSON.stringify(result,null,2)
    );

    setAiAnalysis(
      result.analisis ||
      "Tidak ada analisis"
    );

  } catch(err){

    console.error(err);

  } finally {

    setLoadingAI(false);

  }
};

  const { min, max } = geojsonData?.features
    ? computeRange(geojsonData.features)
    : { min: 0, max: 1 };

  const ranking = geojsonData?.features ? getRanking(geojsonData.features) : [];
  const rataProvinsi =
  geojsonData?.rata_provinsi || 0;
  console.log("Rata provinsi dari API =", geojsonData?.rata_provinsi);
  const activeInfo = selectedKab || hoveredKab;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

      {/* Peta choropleth */}
      <LeafletHeatmapMap
        geojsonData={geojsonData}
        onHover={setHoveredKab}
        onClick={props => {
        setSelectedKab(props);
      }}
        
      />

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 800,
          background: 'rgba(240,244,241,.65)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', padding: '12px 20px', borderRadius: '10px',
            border: '1px solid var(--c-border)', fontSize: '13px', fontWeight: 600,
            color: 'var(--c-jade)', boxShadow: 'var(--shadow-md)',
          }}>
            ⏳ Memuat data wilayah…
          </div>
        </div>
      )}

      {/* Notif kalau banyak komoditas dipilih */}
      {selectedKoms?.length > 1 && (
        <div style={{
          position: 'absolute', top: 54, left: 14, zIndex: 800,
          background: '#fff7ed', border: '1px solid #fed7aa',
          borderRadius: 'var(--radius-md)', padding: '7px 12px',
          fontSize: '11px', color: '#9a3412', fontWeight: 500,
          boxShadow: 'var(--shadow-sm)',
        }}>
          ⚠ Choropleth menampilkan: <strong>{activeKom}</strong>
        </div>
      )}

      {/* ── PANEL INFO + RANKING (kiri bawah) ── */}
      <div style={{
        position: 'absolute', bottom: 14, left: 14, zIndex: 800,
        width: '260px',
        background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(12px)',
        borderRadius: 'var(--radius-lg)', border: '1px solid var(--c-border)',
        boxShadow: 'var(--shadow-md)', overflow: 'hidden',
      }}>

        {/* Info wilayah aktif */}
        <div style={{
          padding: '12px 14px',
          background: activeInfo ? 'linear-gradient(135deg,var(--c-mint),white)' : 'white',
          transition: 'background .2s',
          borderBottom: '1px solid var(--c-border)',
        }}>
          {activeInfo ? (
            <>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--c-muted)', marginBottom: '5px' }}>
                {selectedKab ? '📍 Dipilih' : '🖱 Hover'}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--c-forest)', lineHeight: 1.2, marginBottom: '3px' }}>
                {activeInfo.kabupaten}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--c-muted)', marginBottom: '8px' }}>
                {activeInfo.komoditas_nama} · {activeInfo.tanggal}
              </div>
              <div
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--c-ink)',
              letterSpacing: '-0.5px'
            }}
          >
            {formatRp(activeInfo.rata_kabupaten)}
          </div>
            </>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--c-muted)', fontStyle: 'italic' }}>
              Klik atau arahkan ke wilayah
            </div>
          )}
        </div>

        {/* Legend gradient */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--c-muted)', marginBottom: '6px' }}>
            Skala Harga
          </div>
          <div style={{
            height: '8px', borderRadius: '4px', marginBottom: '5px',
            background: 'linear-gradient(to right, #22c55e 0%, #f97316 50%, #ef4444 100%)',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 600 }}>
            <span style={{ color: '#15803d' }}>{formatRp(min)}</span>
            <span style={{ color: '#b91c1c' }}>{formatRp(max)}</span>
          </div>
        </div>

        {/* Ranking toggle */}
        <button
          onClick={() => setRankOpen(v => !v)}
          style={{
            width: '100%', padding: '9px 14px',
            border: 'none', background: 'transparent',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.07em',
            color: 'var(--c-muted)',
            borderBottom: rankOpen ? '1px solid var(--c-border)' : 'none',
          }}
        >
          <span>Ranking ({ranking.length})</span>
          <span>{rankOpen ? '▲' : '▼'}</span>
        </button>

        {rankOpen && (
          <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '4px 0' }}>
            {ranking.map((f, i) => {
              const val = Number(f.properties.rata_kabupaten);
              const ratio = max === min ? 0 : (val - min) / (max - min);
              const barColor = ratio < 0.33 ? '#22c55e' : ratio < 0.66 ? '#f97316' : '#ef4444';
              const isActive = selectedKab?.kabupaten === f.properties.kabupaten;

              return (
                <div
                  key={f.properties.uid || i}
                  onClick={() => {
                    setSelectedKab(f.properties);
                    getAiAnalysis(f.properties);
                  }}
                  style={{
                    padding: '6px 14px', cursor: 'pointer',
                    background: isActive ? 'var(--c-mint)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'background .12s',
                  }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--c-dim)', minWidth: '16px', textAlign: 'right' }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-ink)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.properties.kabupaten}
                    </div>
                    <div style={{ height: '3px', borderRadius: '2px', background: '#e5e7eb', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${ratio * 100}%`, background: barColor, borderRadius: '2px' }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: barColor, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {formatRp(val)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
            {/* Panel AI Provinsi */}
            <div
              style={{
                position:'absolute',
                bottom:14,
                right:14,
                zIndex:800,
                width:'260px',
                background:'rgba(255,255,255,.97)',
                backdropFilter:'blur(12px)',
                borderRadius:'var(--radius-lg)',
                border:'1px solid var(--c-border)',
                boxShadow:'var(--shadow-md)',
                padding:'12px 14px'
              }}
            >

              <div
                style={{
                  fontSize:'10px',
                  fontWeight:700,
                  letterSpacing:'.07em',
                  textTransform:'uppercase',
                  color:'var(--c-muted)',
                  marginBottom:'6px'
                }}
              >
                🤖 AI Jawa Timur
              </div>

              <div
                style={{
                  fontSize:'11px',
                  color:'var(--c-muted)',
                  marginBottom:'8px'
                }}
              >
                {activeKom} · {selectedDate || 'Tanggal terbaru'}
              </div>

              {loadingAI ? (

                <div
                  style={{
                    fontSize:'12px'
                  }}
                >
                  AI sedang menganalisis...
                </div>

              ) : (

                <div
                  style={{
                    fontSize:'12px',
                    lineHeight:'1.7',
                    color:'#334155'
                  }}
                >
                  {aiAnalysis}
                </div>

              )}

            </div>
    </div>
  );
}