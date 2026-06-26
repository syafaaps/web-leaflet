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
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

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

  const getAiAnalysis = async (props) => {
  try {
    setLoadingAI(true);
    setAiAnalysis('');

    const response = await fetch(
      '/api/analisis-ai-pasar',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          namaPasar: props.nama_pasar,
          kabupaten: props.kabupaten,
          komoditas: props.komoditas_nama,
          harga: props.harga,
          tanggal: props.tanggal,
        }),
      }
    );

    const result = await response.json();

    console.log('HASIL AI =', result);

    setAiAnalysis(
      result[0]?.output ||
      result.output ||
      result.analisis ||
      "Tidak ada analisis"
    );
    console.log(
  "AI ANALYSIS SET =",
  result[0]?.output ||
  result.output ||
  result.analisis
);

  } catch (err) {
    console.error(err);
  } finally {
    setLoadingAI(false);
  }
};

  const filteredPasarData = selectedKabupaten
  ? pasarData.filter(
      item => item.kabupaten === selectedKabupaten
    )
  : pasarData;

console.log("AI STATE =", aiAnalysis);

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
        onMarkerClick={(props) => {
          setSelectedPasar(props);
          getAiAnalysis(props);
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
      {/* Panel AI */}
      {selectedPasar && (
        <div
          style={{
            position:'absolute',
            bottom:14,
            left:14,
            zIndex:800,
            width:'280px',
            maxHeight:'620px',
            display:'flex',
            flexDirection:'column',

            background:'rgba(255,255,255,.97)',
            backdropFilter:'blur(12px)',
            borderRadius:'var(--radius-lg)',
            border:'1px solid var(--c-border)',
            boxShadow:'var(--shadow-md)',
          }}
        >

          {/* Header */}
          <div
            style={{
              padding: '12px 14px',
              background: 'linear-gradient(135deg,var(--c-mint),white)',
              borderBottom: '1px solid var(--c-border)',
            }}
          >

            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '.07em',
                textTransform: 'uppercase',
                color: 'var(--c-muted)',
                marginBottom: '5px',
              }}
            >
              📍 Dipilih
            </div>

            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--c-forest)',
                lineHeight: 1.2,
              }}
            >
              {selectedPasar.nama_pasar}
            </div>

            <div
              style={{
                fontSize: '11px',
                color: 'var(--c-muted)',
                marginTop: '3px',
                marginBottom: '8px',
              }}
            >
              {selectedPasar.komoditas_nama} · {selectedPasar.tanggal}
            </div>

            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--c-ink)',
                letterSpacing: '-0.5px',
              }}
            >
              Rp {Number(selectedPasar.harga).toLocaleString('id-ID')}
            </div>

          </div>

          {/* Body */}
          {loadingAI ? (

          <div
          style={{
          padding:'16px',
          fontSize:'12px'
          }}
          >

          🤖 AI sedang menganalisis...

          </div>

          ) : (

          <div
          style={{
          flex:1,
          overflowY:'auto',
          padding:'14px',
          fontSize:'12px',
          lineHeight:'1.7',
          color:'#334155'
          }}
          >

          <div
          style={{
          fontWeight:700,
          marginBottom:'10px'
          }}
          >

          🤖 Analisis AI

          </div>

          <ReactMarkdown
          components={{

          strong:({children})=>(

          <strong
          style={{
          fontWeight:700,
          color:"#111827"
          }}
          >

          {children}

          </strong>

          ),

          p:({children})=>(

          <p
          style={{
          marginBottom:"12px"
          }}
          >

          {children}

          </p>

          )

          }}
          >

          {aiAnalysis}

          </ReactMarkdown>

          </div>

          )}

        </div>
      )}

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