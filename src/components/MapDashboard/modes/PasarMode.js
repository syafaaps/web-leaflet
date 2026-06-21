import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

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

    Promise.all(
      selectedKoms.map((kom) => {
        const p = new URLSearchParams({
          komoditas: kom,
        });

        if (selectedDate) {
          p.set('tanggal', selectedDate);
        }

        return fetch(`/api/pasar?${p}`).then((r) => r.json());
      })
    )
      .then((results) => {
        const merged = results.flat();

        setPasarData(merged);

        setStats({
          total: merged.length,

          atas: merged.filter(
            d => d.kategori === 'Di Atas Rata-rata'
          ).length,

          rata: merged.filter(
            d => d.kategori === 'Rata-rata'
          ).length,

          bawah: merged.filter(
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
      <LeafletPasarMap pasarData={filteredPasarData} /> 
      

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