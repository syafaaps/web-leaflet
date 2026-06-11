// pages/index.js
import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';

import Layout from '@components/Layout';
import Section from '@components/Section';
import Container from '@components/Container';
import Map from '@components/Map';

import styles from '@styles/Home.module.scss';

const DEFAULT_CENTER = [-7.5, 112.5];

// Hitung stats ringkasan dari pasarData
function computeStats(data) {
  if (!data.length) return { mahal: 0, sedang: 0, murah: 0, total: 0 };
  return {
    total:  data.length,
    mahal:  data.filter(d => d.kategori === 'Mahal').length,
    sedang: data.filter(d => d.kategori === 'Sedang').length,
    murah:  data.filter(d => d.kategori === 'Murah').length,
  };
}

export default function Home() {
  const [pasarData,      setPasarData]      = useState([]);
  const [komoditasList,  setKomoditasList]  = useState([]);
  const [selectedKomoditas, setSelectedKomoditas] = useState('');
  const [selectedDate,   setSelectedDate]   = useState('');
  const [overlayLahan,   setOverlayLahan]   = useState(false);
  const [loading,        setLoading]        = useState(false);

  // Fetch daftar komoditas (sekali)
  // useEffect(() => {
  //   fetch('/api/kategori-komoditas')
  //     .then(r => r.json())
  //     .then(data => {
  //       setKomoditasList(data);
  //       if (data.length > 0) setSelectedKomoditas(data[0].kategori);
  //     })
  //     .catch(console.error);
  // }, []);
   useEffect(() => {
    fetch('/api/heatmap')
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

  // Fetch pasar setiap filter berubah
  const fetchPasar = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedKomoditas) params.set('komoditas', selectedKomoditas);
    if (selectedDate)      params.set('tanggal', selectedDate);

    fetch(`/api/pasar?${params}`)
      .then(r => r.json())
      .then(data => { setPasarData(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [selectedKomoditas, selectedDate]);

  useEffect(() => {
    if (selectedKomoditas) fetchPasar();
  }, [fetchPasar, selectedKomoditas]);

  const stats = computeStats(pasarData);

  return (
    <Layout>
      <Head>
        <title>Dashboard Harga Komoditas</title>
        <meta name="description" content="Komoditas Pangan Jawa Timur" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        :root {
          --green-dark: #0f4c35;
          --green-mid:  #1a7a52;
          --green-light:#d4edda;
          --accent:     #f59e0b;
          --bg:         #f4f7f4;
          --surface:    #ffffff;
          --border:     #e2e8e4;
          --text-primary:   #0f2318;
          --text-secondary: #4a6358;
          --text-muted:     #8aaa98;
          --shadow-sm:  0 1px 4px rgba(15,76,53,0.07);
          --shadow-md:  0 4px 16px rgba(15,76,53,0.10);
          --radius:     12px;
        }
        body { background: var(--bg) !important; font-family: 'DM Sans', sans-serif !important; color: var(--text-primary) !important; }
        * { box-sizing: border-box; }
        select, input { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <Section>
        <Container>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>

            {/* ── HEADER ── */}
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'var(--green-light)', color: 'var(--green-mid)',
                  fontSize: '11px', fontWeight: 600, padding: '4px 10px',
                  borderRadius: '20px', marginBottom: '8px',
                  letterSpacing: '0.06em', textTransform: 'uppercase'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green-mid)', display: 'inline-block' }} />
                  Live Data · Jawa Timur
                </div>
                <h1 style={{
                  fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 800,
                  color: 'var(--green-dark)', margin: 0, lineHeight: 1.1, letterSpacing: '-0.5px'
                }}>
                  Dashboard Harga<br />Komoditas Pangan
                </h1>
              </div>

              {/* Stat cards */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Pasar', value: stats.total, color: 'var(--green-dark)', bg: 'var(--green-light)' },
                  { label: 'Mahal',  value: stats.mahal,  color: '#b91c1c', bg: '#fee2e2' },
                  { label: 'Sedang', value: stats.sedang, color: '#c2410c', bg: '#ffedd5' },
                  { label: 'Murah',  value: stats.murah,  color: '#15803d', bg: '#dcfce7' },
                ].map(c => (
                  <div key={c.label} style={{
                    background: c.bg, border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '10px 14px', minWidth: '80px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: c.color, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>
                      {loading ? '…' : c.value}
                    </div>
                    <div style={{ fontSize: '11px', color: c.color, fontWeight: 600, marginTop: '2px', opacity: 0.8 }}>{c.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── FILTER BAR ── */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: '14px',
              boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'flex-end',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>

                {/* Komoditas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Komoditas
                  </label>
                  <select
                    value={selectedKomoditas}
                    onChange={e => setSelectedKomoditas(e.target.value)}
                    style={{
                      padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)',
                      fontSize: '13px', color: 'var(--text-primary)', background: 'var(--bg)',
                      cursor: 'pointer', outline: 'none', minWidth: '180px', fontWeight: 500
                    }}
                  >
                    {komoditasList.length === 0
                      ? <option>Memuat...</option>
                      : komoditasList.map((k, i) => (
                          // <option key={i} value={k.kategori}>{k.kategori}</option>
                          <option key={i} value={k.komoditas_nama}>
                              {k.kategori}
                          </option>
                        ))
                    }
                  </select>
                </div>

                {/* Tanggal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    style={{
                      padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)',
                      fontSize: '13px', color: 'var(--text-primary)', background: 'var(--bg)',
                      outline: 'none', fontWeight: 500
                    }}
                  />
                </div>

                {/* Tombol refresh */}
                <button
                  onClick={fetchPasar}
                  disabled={loading}
                  style={{
                    padding: '8px 16px', borderRadius: '8px',
                    border: '1px solid var(--green-mid)', background: 'var(--green-mid)',
                    color: 'white', fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', fontFamily: 'DM Sans, sans-serif'
                  }}
                >
                  {loading ? 'Memuat…' : '↻ Perbarui'}
                </button>
              </div>

              {/* Overlay toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', userSelect: 'none' }}>
                <div
                  onClick={() => setOverlayLahan(v => !v)}
                  style={{
                    width: '36px', height: '20px', borderRadius: '10px',
                    background: overlayLahan ? 'var(--green-mid)' : '#d1d5db',
                    position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: '3px', left: overlayLahan ? '19px' : '3px',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
                Overlay Peta Lahan
              </label>
            </div>

            {/* ── PETA ── */}
            <div style={{
              position: 'relative', borderRadius: 'var(--radius)',
              overflow: 'hidden', border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)'
            }}>
              {/* Loading overlay */}
              {loading && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(244,247,244,0.65)',
                  zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(2px)'
                }}>
                  <div style={{
                    background: 'white', padding: '12px 20px', borderRadius: '10px',
                    border: '1px solid var(--border)', fontSize: '13px', fontWeight: 600,
                    color: 'var(--green-mid)', boxShadow: 'var(--shadow-md)'
                  }}>
                    ⏳ Memuat data pasar…
                  </div>
                </div>
              )}

              <Map
                className={styles.homeMap}
                center={DEFAULT_CENTER}
                zoom={8}
                pasarData={pasarData}
              />

              {/* Legend */}
              <div style={{
                position: 'absolute', top: 12, right: 12,
                background: 'rgba(255,255,255,0.97)', padding: '10px 14px',
                borderRadius: '10px', border: '1px solid var(--border)',
                fontSize: '12px', boxShadow: 'var(--shadow-md)',
                zIndex: 1000, backdropFilter: 'blur(6px)'
              }}>
                <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
                  Kategori Harga
                </div>
                {[
                  { color: '#ef4444', label: 'Mahal' },
                  { color: '#f97316', label: 'Sedang' },
                  { color: '#22c55e', label: 'Murah' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
                    <svg width="14" height="18" viewBox="0 0 14 18" style={{ flexShrink: 0 }}>
                      <path d="M7 1C3.686 1 1 3.686 1 7C1 11 7 17 7 17C7 17 13 11 13 7C13 3.686 10.314 1 7 1Z"
                        fill={item.color} stroke={item.color} strokeWidth="0.5"/>
                      <circle cx="7" cy="6.5" r="2.5" fill="white" opacity="0.9"/>
                    </svg>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Badge jumlah */}
              <div style={{
                position: 'absolute', bottom: 12, left: 12,
                background: 'var(--green-dark)', color: '#fff',
                fontSize: '12px', fontWeight: 600, padding: '5px 12px',
                borderRadius: '20px', zIndex: 1000, boxShadow: 'var(--shadow-md)'
              }}>
                {stats.total} pasar · {selectedKomoditas || 'semua'}
              </div>
            </div>

          </div>
        </Container>
      </Section>
    </Layout>
  );
}
