// components/MapDashboard/DashboardShell.js
// Shell utama dashboard — kelola state filter global, mode switcher, overlay komoditas
// Untuk tambah mode baru: buat file di modes/, daftarkan di MODES

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';

// ── Daftar mode — tambah entri baru di sini untuk mode baru ─────────────────
import PasarMode    from './modes/PasarMode';
import KabkotMode   from './modes/KabkotMode';

export const MODES = [
  {
    id: 'pasar',
    label: 'Pasar',
    icon: '🏪',
    desc: 'Pin tiap pasar',
    component: PasarMode,
  },
  {
    id: 'kabkot',
    label: 'Kab / Kota',
    icon: '🗺',
    desc: 'Choropleth wilayah',
    component: KabkotMode,
  },
  // Contoh tambah mode:
  // { id: 'wilayah', label: 'Wilayah', icon: '📍', desc: 'By kecamatan', component: WilayahMode },
];

// ── Helper ───────────────────────────────────────────────────────────────────
function todayString() {
  return new Date().toISOString().slice(0, 10);
}

// ── Komponen utama ────────────────────────────────────────────────────────────
export default function DashboardShell() {
  const [activeMode,       setActiveMode]       = useState('kabkot');
  const [selectedDate,     setSelectedDate]     = useState('');
  const [komoditasList,    setKomoditasList]    = useState([]);
  const [selectedKoms,     setSelectedKoms]     = useState([]); // multi-select checkbox
  const [overlayOpen,      setOverlayOpen]      = useState(true);
  const [overlayMin,       setOverlayMin]       = useState(false); // minimize overlay

  // Fetch semua komoditas tersedia (dari heatmap, sudah include semua)
  useEffect(() => {
    fetch('/api/heatmap')
      .then(r => r.json())
      .then(data => {
        const list = [
          ...new Set((data.features || []).map(f => f.properties.komoditas_nama))
        ].filter(Boolean).sort();
        setKomoditasList(list);
        // Default: pilih komoditas pertama
        if (list.length) setSelectedKoms([list[0]]);
      })
      .catch(console.error);
  }, []);

  const toggleKomoditas = useCallback((kom) => {
    setSelectedKoms(prev =>
      prev.includes(kom)
        ? prev.filter(k => k !== kom)
        : [...prev, kom]
    );
  }, []);

  const ActiveComponent = MODES.find(m => m.id === activeMode)?.component ?? null;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:ital,wght@0,700;0,800;1,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --c-ink:       #0d1f16;
          --c-forest:    #155233;
          --c-jade:      #1e7a52;
          --c-sage:      #3aab74;
          --c-mint:      #d0f0e0;
          --c-paper:     #f5f8f5;
          --c-surface:   #ffffff;
          --c-border:    #daeae1;
          --c-border-mid:#b8d4c4;
          --c-muted:     #7a9e8c;
          --c-dim:       #a8c4b4;

          --c-red:    #ef4444;
          --c-orange: #f97316;
          --c-green:  #22c55e;

          --font-body:    'Plus Jakarta Sans', system-ui, sans-serif;
          --font-display: 'Fraunces', serif;

          --sidebar-w: 280px;
          --overlay-w: 240px;
          --radius-sm: 6px;
          --radius-md: 10px;
          --radius-lg: 16px;
          --shadow-sm: 0 1px 3px rgba(13,31,22,.08);
          --shadow-md: 0 4px 20px rgba(13,31,22,.10);
          --shadow-lg: 0 8px 40px rgba(13,31,22,.14);
          --transition: .18s cubic-bezier(.4,0,.2,1);
        }

        html, body, #__next { height: 100%; }

        body {
          font-family: var(--font-body);
          background: var(--c-paper);
          color: var(--c-ink);
          -webkit-font-smoothing: antialiased;
        }

        button, select, input { font-family: inherit; }

        /* Leaflet overrides */
        .leaflet-tooltip {
          border: none !important;
          box-shadow: var(--shadow-md) !important;
          border-radius: var(--radius-md) !important;
          padding: 0 !important;
          background: transparent !important;
        }
        .leaflet-tooltip::before { display: none !important; }
        .leaflet-container { font-family: var(--font-body) !important; }

        /* Scrollbar halus */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--c-border-mid); border-radius: 2px; }

        /* Animasi */
        @keyframes slideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        .anim-slide { animation: slideIn .22s var(--transition) both; }
        .anim-fade  { animation: fadeIn  .18s ease both; }
      `}</style>

      <div style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--c-paper)',
      }}>

        {/* ════════════════════════════════════════════════════════
            SIDEBAR KIRI
        ════════════════════════════════════════════════════════ */}
        <aside style={{
          width: 'var(--sidebar-w)',
          flexShrink: 0,
          background: 'var(--c-surface)',
          borderRight: '1px solid var(--c-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 20,
          boxShadow: '2px 0 12px rgba(13,31,22,.04)',
        }}>

          {/* ── Logo / judul ── */}
          <div style={{
            padding: '22px 20px 18px',
            borderBottom: '1px solid var(--c-border)',
            background: 'linear-gradient(135deg, var(--c-forest) 0%, var(--c-jade) 100%)',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '.1em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,.55)',
              marginBottom: '6px',
            }}>
              Jawa Timur
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '19px',
              fontWeight: 700, color: '#fff', lineHeight: 1.15,
            }}>
              Dashboard<br />Harga Komoditas
            </div>
            <div style={{
              marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: 'rgba(255,255,255,.15)', borderRadius: '20px',
              padding: '3px 10px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>
                Live Data
              </span>
            </div>
          </div>

          {/* ── Mode switcher ── */}
          <div style={{ padding: '16px 16px 12px' }}>
            <div style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '.08em',
              textTransform: 'uppercase', color: 'var(--c-muted)', marginBottom: '8px',
            }}>
              Tampilan Peta
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {MODES.map(mode => {
                const active = activeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setActiveMode(mode.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px', borderRadius: 'var(--radius-md)',
                      border: active ? '1.5px solid var(--c-jade)' : '1.5px solid transparent',
                      background: active ? 'var(--c-mint)' : 'var(--c-paper)',
                      cursor: 'pointer', transition: 'all var(--transition)',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>{mode.icon}</span>
                    <div>
                      <div style={{
                        fontSize: '13px', fontWeight: active ? 700 : 500,
                        color: active ? 'var(--c-forest)' : 'var(--c-ink)',
                        transition: 'color var(--transition)',
                      }}>
                        {mode.label}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--c-muted)', marginTop: '1px' }}>
                        {mode.desc}
                      </div>
                    </div>
                    {active && (
                      <div style={{
                        marginLeft: 'auto', width: '6px', height: '6px',
                        borderRadius: '50%', background: 'var(--c-jade)', flexShrink: 0,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--c-border)', margin: '0 16px' }} />

          {/* ── Filter Tanggal (global, tetap ada di semua mode) ── */}
          <div style={{ padding: '14px 16px' }}>
            <label style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '.08em',
              textTransform: 'uppercase', color: 'var(--c-muted)',
              display: 'block', marginBottom: '7px',
            }}>
              Tanggal
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{
                width: '100%', padding: '8px 11px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--c-border)', fontSize: '13px',
                color: 'var(--c-ink)', background: 'var(--c-paper)',
                outline: 'none', fontWeight: 500, transition: 'border-color var(--transition)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--c-jade)'}
              onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
            />
            {!selectedDate && (
              <div style={{ fontSize: '11px', color: 'var(--c-muted)', marginTop: '5px' }}>
                Kosong = tanggal terbaru
              </div>
            )}
          </div>

          {/* ── Spacer + info komoditas terpilih ── */}
          <div style={{ flex: 1 }} />

          <div style={{
            padding: '12px 16px 16px',
            borderTop: '1px solid var(--c-border)',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-muted)', marginBottom: '7px' }}>
              Komoditas Aktif
            </div>
            {selectedKoms.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--c-muted)', fontStyle: 'italic' }}>
                Belum ada yang dipilih
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {selectedKoms.map(k => (
                  <span key={k} style={{
                    fontSize: '11px', fontWeight: 600,
                    padding: '3px 8px', borderRadius: '20px',
                    background: 'var(--c-mint)', color: 'var(--c-forest)',
                    border: '1px solid var(--c-border)',
                  }}>
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ════════════════════════════════════════════════════════
            AREA UTAMA (PETA + OVERLAY KOMODITAS)
        ════════════════════════════════════════════════════════ */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {/* ── Render mode aktif ── */}
          {ActiveComponent && (
            <div className="anim-fade" key={activeMode} style={{ width: '100%', height: '100%' }}>
              <ActiveComponent
                selectedDate={selectedDate}
                selectedKoms={selectedKoms}
              />
            </div>
          )}

          {/* ── Badge aktif (kiri atas peta) ── */}
          <div style={{
            position: 'absolute', top: 14, left: 14, zIndex: 900,
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(8px)',
            padding: '6px 12px', borderRadius: '20px',
            border: '1px solid var(--c-border)',
            boxShadow: 'var(--shadow-sm)',
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: '14px' }}>
              {MODES.find(m => m.id === activeMode)?.icon}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--c-forest)' }}>
              {MODES.find(m => m.id === activeMode)?.label}
            </span>
            {selectedKoms.length > 0 && (
              <>
                <span style={{ color: 'var(--c-dim)', fontSize: '11px' }}>·</span>
                <span style={{ fontSize: '11px', color: 'var(--c-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedKoms.join(', ')}
                </span>
              </>
            )}
          </div>

          {/* ════════════════════════════════════════════════════
              OVERLAY KOMODITAS (kanan, bisa minimize)
          ════════════════════════════════════════════════════ */}
          <div style={{
            position: 'absolute', top: 14, right: 14, zIndex: 1000,
            background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--c-border)',
            boxShadow: 'var(--shadow-md)',
            width: overlayMin ? 'auto' : 'var(--overlay-w)',
            overflow: 'hidden',
            transition: 'width var(--transition)',
          }}>

            {/* Header overlay */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: overlayMin ? '8px 10px' : '10px 14px',
              borderBottom: overlayMin ? 'none' : '1px solid var(--c-border)',
              cursor: 'pointer',
              userSelect: 'none',
              gap: '8px',
            }}
              onClick={() => setOverlayMin(v => !v)}
            >
              {!overlayMin && (
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-muted)' }}>
                    Komoditas
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--c-muted)', marginTop: '1px' }}>
                    {selectedKoms.length} dipilih
                  </div>
                </div>
              )}
              {overlayMin && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c-jade)' }}>
                  🌾 {selectedKoms.length} komoditas
                </span>
              )}
              <button style={{
                background: 'var(--c-paper)', border: '1px solid var(--c-border)',
                borderRadius: '6px', width: '24px', height: '24px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', color: 'var(--c-muted)', flexShrink: 0,
                transition: 'all var(--transition)',
              }}>
                {overlayMin ? '◀' : '▶'}
              </button>
            </div>

            {/* Daftar checkbox komoditas */}
            {!overlayMin && (
              <div style={{
                maxHeight: '55vh', overflowY: 'auto',
                padding: '8px 0',
              }}>
                {komoditasList.length === 0 ? (
                  <div style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--c-muted)' }}>
                    Memuat…
                  </div>
                ) : (
                  komoditasList.map(kom => {
                    const checked = selectedKoms.includes(kom);
                    return (
                      <label
                        key={kom}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '9px',
                          padding: '7px 14px', cursor: 'pointer',
                          background: checked ? 'var(--c-mint)' : 'transparent',
                          transition: 'background var(--transition)',
                        }}
                      >
                        {/* Custom checkbox */}
                        <div style={{
                          width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                          border: checked ? '2px solid var(--c-jade)' : '1.5px solid var(--c-border-mid)',
                          background: checked ? 'var(--c-jade)' : 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all var(--transition)',
                        }}>
                          {checked && (
                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                              <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleKomoditas(kom)}
                          style={{ display: 'none' }}
                        />
                        <span style={{
                          fontSize: '12px',
                          fontWeight: checked ? 600 : 400,
                          color: checked ? 'var(--c-forest)' : 'var(--c-ink)',
                          transition: 'all var(--transition)',
                          lineHeight: 1.3,
                        }}>
                          {kom}
                        </span>
                      </label>
                    );
                  })
                )}

                {/* Aksi cepat */}
                {komoditasList.length > 0 && (
                  <div style={{
                    display: 'flex', gap: '6px', padding: '8px 14px 4px',
                    borderTop: '1px solid var(--c-border)', marginTop: '4px',
                  }}>
                    <button
                      onClick={() => setSelectedKoms([...komoditasList])}
                      style={{
                        flex: 1, padding: '5px 0', borderRadius: '6px', fontSize: '11px',
                        fontWeight: 600, border: '1px solid var(--c-border)',
                        background: 'var(--c-paper)', color: 'var(--c-jade)', cursor: 'pointer',
                      }}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setSelectedKoms([])}
                      style={{
                        flex: 1, padding: '5px 0', borderRadius: '6px', fontSize: '11px',
                        fontWeight: 600, border: '1px solid var(--c-border)',
                        background: 'var(--c-paper)', color: 'var(--c-muted)', cursor: 'pointer',
                      }}
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </main>
      </div>
    </>
  );
}