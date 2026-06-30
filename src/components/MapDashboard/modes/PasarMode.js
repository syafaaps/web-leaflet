import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from "react-markdown";

const LeafletPasarMap = dynamic(
  () => import('../../Map/LeafletDynamicMap'),
  { ssr: false, loading: () => <MapLoading /> }
);

function MapLoading() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f4f1',
        color: '#4a6358',
        fontSize: '13px',
        fontFamily: 'var(--font-body)',
      }}
    >
      Memuat peta…
    </div>
  );
}

export default function PasarMode({ selectedDate, selectedKoms, selectedKabupaten }) {
  const [pasarData, setPasarData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedPasar, setSelectedPasar] = useState(null);
  const [address, setAddress] = useState('');

  // Kabupaten-level AI
  const [kabAiAnalysis, setKabAiAnalysis] = useState('');
  const [kabAiLoading, setKabAiLoading] = useState(false);
  const [kabAiMeta, setKabAiMeta] = useState(null); // { rataKabupaten, rataProvinsi, rankKabupaten, totalKabupaten }

  const [stats, setStats] = useState({
    total: 0,
    atas: 0,
    rata: 0,
    bawah: 0,
  });

  const fetchData = useCallback(() => {
    if (!selectedKoms?.length) {
      setPasarData([]);
      return;
    }

    setLoading(true);

    const kom = selectedKoms[0];

    const p = new URLSearchParams({
      komoditas: kom,
    });

    if (selectedDate) {
      p.set('tanggal', selectedDate);
    }

    fetch(`/api/pasar?${p}`)
      .then((r) => r.json())
      .then((data) => {

        const filtered = data.filter(
          item =>
            item.harga !== null &&
            Number(item.harga) > 0
        );

        setPasarData(filtered);

        setStats({
          total: filtered.length,

          atas: filtered.filter(
            d => d.kategori === 'Di Atas Rata-rata'
          ).length,

          rata: filtered.filter(
            d => d.kategori === 'Rata-rata'
          ).length,

          bawah: filtered.filter(
            d => d.kategori === 'Di Bawah Rata-rata'
          ).length,
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedKoms, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedPasar && pasarData?.length > 0) {
      const updated = pasarData.find(item => item.uid === selectedPasar.uid);
      if (updated) {
        if (
          updated.komoditas_nama !== selectedPasar.komoditas_nama ||
          updated.harga !== selectedPasar.harga ||
          updated.tanggal !== selectedPasar.tanggal
        ) {
          setSelectedPasar(updated);
        }
      } else {
        setSelectedPasar(null);
      }
    }
  }, [pasarData, selectedPasar]);

  // Reset selectedPasar when kabupaten changes
  useEffect(() => {
    setSelectedPasar(null);
  }, [selectedKabupaten]);

  // Auto-trigger kabupaten AI analysis when kabupaten or komoditas changes
  useEffect(() => {
    const kom = selectedKoms?.[0];
    if (!selectedKabupaten || !kom || !selectedDate) {
      setKabAiAnalysis('');
      setKabAiMeta(null);
      return;
    }
    setKabAiLoading(true);
    setKabAiAnalysis('');
    setKabAiMeta(null);

    fetch('/api/analisis-ai-kabupaten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kabupaten: selectedKabupaten,
        komoditas: kom,
        tanggal: selectedDate,
      }),
    })
      .then(r => r.json())
      .then(data => {
        setKabAiAnalysis(data.analisis || 'Tidak ada analisis');
        setKabAiMeta({
          rataKabupaten: data.rataKabupaten,
          rataProvinsi: data.rataProvinsi,
          rankKabupaten: data.rankKabupaten,
          totalKabupaten: data.totalKabupaten,
        });
      })
      .catch(err => {
        console.error(err);
        setKabAiAnalysis('Gagal memuat analisis.');
      })
      .finally(() => setKabAiLoading(false));
  }, [selectedKabupaten, selectedKoms, selectedDate]);



  const filteredPasarData = selectedKabupaten
    ? pasarData.filter(
      item => item.kabupaten === selectedKabupaten
    )
    : pasarData;



  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <LeafletPasarMap
        pasarData={filteredPasarData}
        selectedPasar={selectedPasar}
        selectedKabupaten={selectedKabupaten}
        onMarkerClick={(props) => {
          setSelectedPasar(props);
          setAddress('Memuat alamat...');
          fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${props.latitude}&lon=${props.longitude}`, {
            headers: {
              'User-Agent': 'Web-Leaflet-App'
            }
          })
            .then((res) => res.json())
            .then((data) => {
              if (data && data.display_name) {
                setAddress(data.display_name);
              } else {
                setAddress(`${props.kabupaten}, Jawa Timur`);
              }
            })
            .catch(() => {
              setAddress(`${props.kabupaten}, Jawa Timur`);
            });
        }}
      />
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 800,
            background: 'rgba(240,244,241,.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '12px 20px',
              borderRadius: '10px',
              border: '1px solid var(--c-border)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--c-jade)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            ⏳ Memuat data pasar…
          </div>
        </div>
      )}

      {/* Statistik */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 800,
          display: 'flex',
          gap: '8px',
          background: 'rgba(255,255,255,.95)',
          backdropFilter: 'blur(8px)',
          padding: '8px 14px',
          borderRadius: '20px',
          border: '1px solid var(--c-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {[
          {
            label: 'Total',
            val: stats.total,
            color: 'var(--c-forest)',
          },
          {
            label: 'Di Atas Rata-rata',
            val: stats.atas,
            color: '#ef4444',
          },
          {
            label: 'Rata-rata',
            val: stats.rata,
            color: '#f97316',
          },
          {
            label: 'Di Bawah Rata-rata',
            val: stats.bawah,
            color: '#22c55e',
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              textAlign: 'center',
              minWidth: '70px',
            }}
          >
            <div
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: s.color,
                lineHeight: 1,
              }}
            >
              {s.val}
            </div>

            <div
              style={{
                fontSize: '10px',
                color: 'var(--c-muted)',
                marginTop: '2px',
                fontWeight: 600,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
      {/* ═══ LEFT COLUMN: Kabupaten panel + (optional) Pasar panel stacked ═══ */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          zIndex: 800,
          width: '280px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: 'calc(100% - 110px)',
          pointerEvents: 'none',
        }}
      >
        {/* ── Panel Info Pasar (muncul di ATAS panel kab saat marker diklik) ── */}
        {selectedPasar && (
          <div
            style={{
              background: 'rgba(255,255,255,.97)',
              backdropFilter: 'blur(12px)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--c-border)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '260px',
              overflow: 'hidden',
              pointerEvents: 'auto',
            }}
          >
            {/* Header pasar */}
            <div
              style={{
                padding: '12px 14px',
                background: 'linear-gradient(135deg,var(--c-mint),white)',
                borderBottom: '1px solid var(--c-border)',
                flexShrink: 0,
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedPasar(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--c-muted)',
                  lineHeight: 1,
                  padding: '2px 4px',
                  zIndex: 10,
                }}
                title="Tutup"
              >
                ✕
              </button>

              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--c-forest)',
                  lineHeight: 1.2,
                  paddingRight: '20px',
                }}
              >
                {selectedPasar.nama_pasar}
              </div>

              {/* Alamat & Google Maps */}
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--c-muted)',
                  marginTop: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                }}
              >
                <span style={{ fontWeight: 500, lineHeight: 1.3 }}>📍 {address || `${selectedPasar.kabupaten}, Jawa Timur`}</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedPasar.latitude},${selectedPasar.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    background: 'var(--c-jade)',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    width: 'fit-content',
                    marginTop: '2px',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'background var(--transition)',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--c-forest)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--c-jade)'}
                >
                  🗺️ Buka di Google Maps
                </a>
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--c-muted)',
                  marginTop: '8px',
                  marginBottom: '4px',
                }}
              >
                {selectedPasar.komoditas_nama} · {selectedPasar.tanggal}
              </div>

              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: 'var(--c-ink)',
                  letterSpacing: '-0.5px',
                }}
              >
                Rp {Number(selectedPasar.harga).toLocaleString('id-ID')}
              </div>
            </div>

          </div>
        )}

        {/* ── Panel AI Kabupaten (selalu tampil saat kabupaten dipilih) ── */}
        {selectedKabupaten && (
          <div
            style={{
              background: 'rgba(255,255,255,.97)',
              backdropFilter: 'blur(12px)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--c-border)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: selectedPasar ? '340px' : '520px',
              overflow: 'hidden',
              pointerEvents: 'auto',
            }}
          >
            {/* Header kabupaten */}
            <div
              style={{
                padding: '12px 14px',
                background: 'linear-gradient(135deg, #e8f5e9, white)',
                borderBottom: '1px solid var(--c-border)',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--c-muted)', marginBottom: '3px' }}>
                {kabAiMeta?.rankKabupaten
                  ? `🏆 Peringkat ${kabAiMeta.rankKabupaten} dari ${kabAiMeta.totalKabupaten}`
                  : '📊 Analisis Wilayah'}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--c-forest)', lineHeight: 1.2 }}>
                {selectedKabupaten}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--c-muted)', marginTop: '3px' }}>
                {selectedKoms?.[0]} · {selectedDate}
              </div>
              {kabAiMeta && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Rata Kab</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--c-ink)' }}>
                      Rp {Number(kabAiMeta.rataKabupaten).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Rata Provinsi</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--c-forest)' }}>
                      Rp {Number(kabAiMeta.rataProvinsi).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Body AI kabupaten */}
            {kabAiLoading ? (
              <div style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--c-muted)' }}>
                🤖 AI sedang menganalisis wilayah...
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '12px 14px',
                  fontSize: '12px',
                  lineHeight: '1.7',
                  color: '#334155',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '11px', color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  🤖 Analisis Wilayah ini
                </div>
                <ReactMarkdown
                  components={{
                    strong: ({ children }) => (
                      <strong style={{ fontWeight: 700, color: '#111827' }}>{children}</strong>
                    ),
                    p: ({ children }) => (
                      <p style={{ marginBottom: '10px' }}>{children}</p>
                    ),
                  }}
                >
                  {kabAiAnalysis}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 56,
          right: 14,
          zIndex: 800,
          background: 'rgba(255,255,255,.95)',
          backdropFilter: 'blur(8px)',
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--c-border)',
          boxShadow: 'var(--shadow-sm)',
          fontSize: '11px',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: 'var(--c-muted)',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            marginBottom: '7px',
            fontSize: '10px',
          }}
        >
          Kategori Harga
        </div>

        {[
          {
            color: '#ef4444',
            label: 'Di Atas Rata-rata',
          },
          {
            color: '#f97316',
            label: 'Rata-rata',
          },
          {
            color: '#22c55e',
            label: 'Di Bawah Rata-rata',
          },
        ].map((l) => (
          <div
            key={l.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              marginBottom: '5px',
            }}
          >
            <svg width="12" height="16" viewBox="0 0 12 16">
              <path
                d="M6 0.5C2.96 0.5 0.5 2.96 0.5 6C0.5 10 6 15.5 6 15.5C6 15.5 11.5 10 11.5 6C11.5 2.96 9.04 0.5 6 0.5Z"
                fill={l.color}
              />
              <circle
                cx="6"
                cy="5.8"
                r="2.3"
                fill="white"
                opacity=".9"
              />
            </svg>

            <span
              style={{
                color: 'var(--c-ink)',
                fontWeight: 500,
              }}
            >
              {l.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}