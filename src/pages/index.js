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
// import Head from 'next/head';
// import { useEffect, useState } from 'react';

// import Layout from '@components/Layout';
// import Section from '@components/Section';
// import Container from '@components/Container';
// import Map from '@components/Map';

// import styles from '@styles/Home.module.scss';

// const DEFAULT_CENTER = [-7.5, 112.5];

// export default function Home() {
//   const [pasarData, setPasarData] = useState([]);
//   const [komoditasList, setKomoditasList] = useState([]);
//   const [selectedKomoditas, setSelectedKomoditas] = useState('');
//   const [selectedDate, setSelectedDate] = useState('');
//   const [sliderValue, setSliderValue] = useState(1);
//   const [overlayLahan, setOverlayLahan] = useState(false);

//   // Fetch pasar markers
//   useEffect(() => {
//     fetch('/api/pasar')
//       .then(res => res.json())
//       .then(data => setPasarData(data))
//       .catch(err => console.error('Gagal fetch pasar:', err));
//   }, []);

//   // Fetch kategori komoditas
//   useEffect(() => {
//     fetch('/api/kategori-komoditas')
//       .then(res => res.json())
//       .then(data => {
//         setKomoditasList(data);
//         if (data.length > 0) setSelectedKomoditas(data[0].kategori);
//       })
//       .catch(err => console.error('Gagal fetch komoditas:', err));
//   }, []);

//   return (
//     <Layout>
//       <Head>
//         <title>Dashboard Harga Komoditas</title>
//         <meta name="description" content="Komoditas Pangan Jawa Timur" />
//         <link rel="icon" href="/favicon.ico" />
//         <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
//       </Head>

//       <style jsx global>{`
//         :root {
//           --green-dark: #0f4c35;
//           --green-mid: #1a7a52;
//           --green-light: #d4edda;
//           --accent: #f59e0b;
//           --accent-soft: #fef3c7;
//           --bg: #f4f7f4;
//           --surface: #ffffff;
//           --border: #e2e8e4;
//           --text-primary: #0f2318;
//           --text-secondary: #4a6358;
//           --text-muted: #8aaa98;
//           --shadow-sm: 0 1px 4px rgba(15,76,53,0.07);
//           --shadow-md: 0 4px 16px rgba(15,76,53,0.10);
//           --radius: 12px;
//         }

//         body {
//           background: var(--bg) !important;
//           font-family: 'DM Sans', sans-serif !important;
//           color: var(--text-primary) !important;
//         }

//         * { box-sizing: border-box; }
//       `}</style>

//       <Section>
//         <Container>
//           <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 0' }}>

//             {/* ── HEADER ── */}
//             <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
//               <div>
//                 <div style={{
//                   display: 'inline-flex',
//                   alignItems: 'center',
//                   gap: '6px',
//                   background: 'var(--green-light)',
//                   color: 'var(--green-mid)',
//                   fontSize: '11px',
//                   fontWeight: 600,
//                   padding: '4px 10px',
//                   borderRadius: '20px',
//                   marginBottom: '8px',
//                   letterSpacing: '0.06em',
//                   textTransform: 'uppercase'
//                 }}>
//                   <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green-mid)', display: 'inline-block' }} />
//                   Live Data · Jawa Timur
//                 </div>
//                 <h1 style={{
//                   fontFamily: 'Syne, sans-serif',
//                   fontSize: '28px',
//                   fontWeight: 800,
//                   color: 'var(--green-dark)',
//                   margin: 0,
//                   lineHeight: 1.1,
//                   letterSpacing: '-0.5px'
//                 }}>
//                   Dashboard Harga<br />Komoditas Pangan
//                 </h1>
//               </div>

//               <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
//                 {[
//                   { label: 'Total Pasar', value: pasarData.length, icon: '🏪' },
//                   { label: 'Komoditas', value: komoditasList.length, icon: '🌾' },
//                 ].map(card => (
//                   <div key={card.label} style={{
//                     background: 'var(--surface)',
//                     border: '1px solid var(--border)',
//                     borderRadius: 'var(--radius)',
//                     padding: '10px 16px',
//                     minWidth: '110px',
//                     boxShadow: 'var(--shadow-sm)'
//                   }}>
//                     <div style={{ fontSize: '18px', marginBottom: '2px' }}>{card.icon}</div>
//                     <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--green-dark)', fontFamily: 'Syne, sans-serif' }}>{card.value}</div>
//                     <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{card.label}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* ── FILTER BAR ── */}
//             <div style={{
//               background: 'var(--surface)',
//               border: '1px solid var(--border)',
//               borderRadius: 'var(--radius)',
//               padding: '12px 16px',
//               marginBottom: '14px',
//               boxShadow: 'var(--shadow-sm)',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'space-between',
//               flexWrap: 'wrap',
//               gap: '12px'
//             }}>
//               <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

//                 {/* Komoditas dropdown - dynamic */}
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
//                   <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Komoditas</label>
//                   <select
//                     value={selectedKomoditas}
//                     onChange={e => setSelectedKomoditas(e.target.value)}
//                     style={{
//                       padding: '7px 12px',
//                       borderRadius: '8px',
//                       border: '1px solid var(--border)',
//                       fontSize: '13px',
//                       fontFamily: 'DM Sans, sans-serif',
//                       color: 'var(--text-primary)',
//                       background: 'var(--bg)',
//                       cursor: 'pointer',
//                       outline: 'none',
//                       minWidth: '160px'
//                     }}
//                   >
//                     {komoditasList.length === 0
//                       ? <option>Memuat...</option>
//                       : komoditasList.map((k, i) => (
//                           <option key={i} value={k.kategori}>{k.kategori}</option>
//                         ))
//                     }
//                   </select>
//                 </div>

//                 {/* Tanggal */}
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
//                   <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tanggal</label>
//                   <input
//                     type="date"
//                     value={selectedDate}
//                     onChange={e => setSelectedDate(e.target.value)}
//                     style={{
//                       padding: '7px 12px',
//                       borderRadius: '8px',
//                       border: '1px solid var(--border)',
//                       fontSize: '13px',
//                       fontFamily: 'DM Sans, sans-serif',
//                       color: 'var(--text-primary)',
//                       background: 'var(--bg)',
//                       outline: 'none'
//                     }}
//                   />
//                 </div>
//               </div>

//               {/* Overlay toggle */}
//               <label style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '8px',
//                 fontSize: '13px',
//                 color: 'var(--text-secondary)',
//                 fontWeight: 500,
//                 cursor: 'pointer',
//                 userSelect: 'none'
//               }}>
//                 <div
//                   onClick={() => setOverlayLahan(v => !v)}
//                   style={{
//                     width: '36px',
//                     height: '20px',
//                     borderRadius: '10px',
//                     background: overlayLahan ? 'var(--green-mid)' : '#d1d5db',
//                     position: 'relative',
//                     transition: 'background 0.2s',
//                     cursor: 'pointer',
//                     flexShrink: 0
//                   }}
//                 >
//                   <div style={{
//                     width: '14px',
//                     height: '14px',
//                     borderRadius: '50%',
//                     background: '#fff',
//                     position: 'absolute',
//                     top: '3px',
//                     left: overlayLahan ? '19px' : '3px',
//                     transition: 'left 0.2s',
//                     boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
//                   }} />
//                 </div>
//                 Overlay Peta Lahan
//               </label>
//             </div>

//             {/* ── MAP AREA ── */}
//             <div style={{
//               position: 'relative',
//               borderRadius: 'var(--radius)',
//               overflow: 'hidden',
//               border: '1px solid var(--border)',
//               boxShadow: 'var(--shadow-md)'
//             }}>
//               <Map
//                 className={styles.homeMap}
//                 width="800"
//                 height="400"
//                 center={DEFAULT_CENTER}
//                 zoom={8}
//                 pasarData={pasarData}
//               />

//               {/* Legend */}
//               <div style={{
//                 position: 'absolute',
//                 top: 12,
//                 right: 12,
//                 background: 'rgba(255,255,255,0.97)',
//                 padding: '10px 14px',
//                 borderRadius: '10px',
//                 border: '1px solid var(--border)',
//                 fontSize: '12px',
//                 boxShadow: 'var(--shadow-md)',
//                 zIndex: 1000,
//                 backdropFilter: 'blur(6px)'
//               }}>
//                 <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
//                   Kategori Harga
//                 </div>
//                 {[
//                   { color: '#16a34a', label: 'Murah' },
//                   { color: '#f59e0b', label: 'Sedang' },
//                   { color: '#ef4444', label: 'Mahal' },
//                 ].map(item => (
//                   <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
//                     <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
//                     <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
//                   </div>
//                 ))}
//               </div>

//               {/* Pasar count badge */}
//               <div style={{
//                 position: 'absolute',
//                 bottom: 12,
//                 left: 12,
//                 background: 'var(--green-dark)',
//                 color: '#fff',
//                 fontSize: '12px',
//                 fontWeight: 600,
//                 padding: '5px 10px',
//                 borderRadius: '20px',
//                 zIndex: 1000,
//                 boxShadow: 'var(--shadow-md)'
//               }}>
//                 {pasarData.length} pasar ditampilkan
//               </div>
//             </div>

//             {/* ── TIME SLIDER ── */}
//             <div style={{
//               marginTop: '14px',
//               background: 'var(--surface)',
//               border: '1px solid var(--border)',
//               borderRadius: 'var(--radius)',
//               padding: '14px 18px',
//               boxShadow: 'var(--shadow-sm)'
//             }}>
//               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
//                 <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
//                   Rentang Waktu
//                 </span>
//                 <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green-dark)', background: 'var(--green-light)', padding: '2px 10px', borderRadius: '20px' }}>
//                   {new Date(2024, 0, sliderValue).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
//                 </span>
//               </div>
//               <input
//                 type="range"
//                 min="1"
//                 max="30"
//                 value={sliderValue}
//                 onChange={e => setSliderValue(Number(e.target.value))}
//                 style={{
//                   width: '100%',
//                   accentColor: 'var(--green-mid)',
//                   cursor: 'pointer'
//                 }}
//               />
//               <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
//                 <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1 Apr</span>
//                 <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>30 Apr 2024</span>
//               </div>
//             </div>

//           </div>
//         </Container>
//       </Section>
//     </Layout>
//   );
// }
// import Head from 'next/head';
// import { useEffect, useState } from 'react';

// import Layout from '@components/Layout';
// import Section from '@components/Section';
// import Container from '@components/Container';
// import Map from '@components/Map';

// import styles from '@styles/Home.module.scss';

// const DEFAULT_CENTER = [-7.5, 112.5];

// export default function Home() {
//   const [pasarData, setPasarData] = useState([]);

//   useEffect(() => {
//     fetch('/api/pasar')
//       .then(res => res.json())
//       .then(data => {
//         setPasarData(data);
//       });
//   }, []);

//   return (
//     <Layout>
//       <Head>
//         <title>Dashboard Harga Komoditas</title>
//         <meta name="description" content="Komoditas Pangan Jawa Timur" />
//         <link rel="icon" href="/favicon.ico" />
//       </Head>

//       <Section>
//         <Container>

//           {/* 🔥 HEADER (TETAP ADA, DIPERCANTIK) */}
//           <div style={{
//             marginBottom: '12px'
//           }}>
//             <h3 className={styles.title} style={{
//               marginBottom: '4px',
//               fontWeight: 600
//             }}>
//               🥬 Dashboard Harga Komoditas Jawa Timur
//             </h3>

//             <div style={{
//               fontSize: '13px',
//               color: '#666'
//             }}>
//               Visualisasi sebaran harga pasar berbasis peta interaktif
//             </div>
//           </div>

//           {/* 🔥 TOP BAR (DITAMBAHIN POLISH, BUKAN DIUBAH) */}
//           <div style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             marginBottom: '10px',
//             background: '#ffffff',
//             padding: '10px 15px',
//             borderRadius: '10px',
//             border: '1px solid #e5e7eb',
//             boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
//           }}>

//             <div style={{ display: 'flex', gap: '10px' }}>
//               <select style={{
//                 padding: '6px 10px',
//                 borderRadius: '6px',
//                 border: '1px solid #ddd',
//                 fontSize: '13px'
//               }}>
//                 <option>Cabai Merah</option>
//                 <option>Beras</option>
//                 <option>Daging</option>
//               </select>

//               <input type="date" style={{
//                 padding: '6px 10px',
//                 borderRadius: '6px',
//                 border: '1px solid #ddd',
//                 fontSize: '13px'
//               }} />
//             </div>

//             <label style={{ fontSize: '13px', color: '#444' }}>
//               <input type="checkbox" /> Overlay Peta Lahan
//             </label>
//           </div>

//           {/* 🔥 MAP */}
//           <div style={{ position: 'relative' }}>

//             <Map
//               className={styles.homeMap}
//               width="800"
//               height="400"
//               center={DEFAULT_CENTER}
//               zoom={8}
//             >
//               {({ TileLayer, Marker, Popup }) => (
//                 <>
//                   <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

//                   {pasarData.map((item, index) => (
//                     <Marker
//                       key={index}
//                       position={[
//                         Number(item.latitude),
//                         Number(item.longitude)
//                       ]}
//                     >
//                       <Popup>
//                         <div style={{
//                           fontSize: '13px',
//                           lineHeight: '1.4'
//                         }}>
//                           <div style={{
//                             fontWeight: 600,
//                             marginBottom: '3px'
//                           }}>
//                             {item.nama_pasar}
//                           </div>

//                           <div style={{
//                             color: '#666'
//                           }}>
//                             {item.kabupaten}
//                           </div>
//                         </div>
//                       </Popup>
//                     </Marker>
//                   ))}
//                 </>
//               )}
//             </Map>

//             {/* 🔥 LEGEND (LEBIH HALUS, GAK NORAK) */}
//             <div style={{
//               position: 'absolute',
//               top: 10,
//               right: 10,
//               background: 'rgba(255,255,255,0.95)',
//               padding: '8px 10px',
//               borderRadius: '8px',
//               border: '1px solid #eee',
//               fontSize: '12px'
//             }}>
//               <div style={{ fontWeight: 600, marginBottom: '4px' }}>
//                 Kategori Harga
//               </div>
//               <div>🟢 Murah</div>
//               <div>🟡 Sedang</div>
//               <div>🔴 Mahal</div>
//             </div>

//           </div>

//           {/* 🔥 SLIDER (DITETAPIN, DIPERHALUS) */}
//           <div style={{
//             marginTop: '10px',
//             background: '#ffffff',
//             padding: '10px',
//             borderRadius: '10px',
//             border: '1px solid #e5e7eb'
//           }}>
//             <input type="range" min="1" max="30" style={{ width: '100%' }} />
//             <div style={{
//               textAlign: 'center',
//               fontSize: '12px',
//               color: '#666'
//             }}>
//               April 2024
//             </div>
//           </div>

//         </Container>
//       </Section>
//     </Layout>
//   );
// }
// import Head from 'next/head';

// import Layout from '@components/Layout';
// import Section from '@components/Section';
// import Container from '@components/Container';
// import Map from '@components/Map';

// import styles from '@styles/Home.module.scss';

// export default function Home() {
//   return (
//     <Layout>
//       <Head>
//         <title>Dashboard Harga Komoditas</title>
//         <meta name="description" content="Komoditas Pangan Jawa Timur" />
//         <link rel="icon" href="/favicon.ico" />
//       </Head>

//       <Section>
//         <Container>
//           <h3 className={styles.title}>
//             🥬 Dashboard Harga Komoditas Jawa Timur 🌾
//           </h3>

//           {/* 🔥 TOP BAR (FILTER + CONTROL) */}
//           <div style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             marginBottom: '10px',
//             background: '#f9fafb',
//             padding: '10px 15px',
//             borderRadius: '10px',
//             border: '1px solid #e5e7eb'
//           }}>

//             {/* LEFT */}
//             <div style={{ display: 'flex', gap: '10px' }}>
//               <select>
//                 <option>Cabai Merah</option>
//                 <option>Beras</option>
//                 <option>Daging</option>
//               </select>

//               <input type="date" />
//             </div>

//             {/* RIGHT */}
//             <div>
//               <label style={{ fontSize: '14px' }}>
//                 <input type="checkbox" /> Overlay Peta Lahan
//               </label>
//             </div>
//           </div>

//           {/* 🔥 MAP + WRAPPER */}
//           <div style={{ position: 'relative' }}>

//             {/* MAP ASLI */}
//             <Map className={styles.homeMap} width="800" height="400" />

//             {/* 🔥 LEGEND (pojok kanan, clean) */}
//             <div style={{
//               position: 'absolute',
//               top: 10,
//               right: 10,
//               background: 'white',
//               padding: '10px',
//               borderRadius: '10px',
//               boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
//             }}>
//               <h4 style={{ margin: '0 0 5px 0' }}>Legend</h4>
//               <div><span style={{ color: 'green' }}>●</span> Murah</div>
//               <div><span style={{ color: 'orange' }}>●</span> Sedang</div>
//               <div><span style={{ color: 'red' }}>●</span> Mahal</div>
//             </div>

//           </div>

//           {/* 🔥 TIME SLIDER (di bawah map, bukan overlay) */}
//           <div style={{
//             marginTop: '10px',
//             background: '#f9fafb',
//             padding: '10px',
//             borderRadius: '10px',
//             border: '1px solid #e5e7eb'
//           }}>
//             <input type="range" min="1" max="30" style={{ width: '100%' }} />
//             <div style={{ textAlign: 'center', fontSize: '14px' }}>
//               April 2024
//             </div>
//           </div>

//         </Container>
//       </Section>
//     </Layout>
//   );
// }
// import Head from 'next/head';

// import Layout from '@components/Layout';
// import Section from '@components/Section';
// import Container from '@components/Container';
// import Map from '@components/Map';

// import styles from '@styles/Home.module.scss';

// export default function Home() {
//   return (
//     <Layout>
//       <Head>
//         <title>Dashboard Harga Komoditas</title>
//         <meta name="description" content="Komoditas Pangan Jawa Timur" />
//         <link rel="icon" href="/favicon.ico" />
//       </Head>

//       <Section>
//         <Container>
//           <h3 className={styles.title}>
//             🥬 Dashboard Harga Komoditas Jawa Timur 🌾
//           </h3>

//           {/* WRAPPER MAP */}
//           <div style={{ position: 'relative' }}>

//             {/* 🔥 MAP ASLI (TIDAK DIUBAH) */}
//             <Map className={styles.homeMap} width="800" height="400" />

//             {/* 🔥 FILTER ATAS */}
//             <div style={{
//               position: 'absolute',
//               top: 10,
//               left: 10,
//               display: 'flex',
//               gap: '10px',
//               background: 'rgba(255,255,255,0.9)',
//               padding: '10px',
//               borderRadius: '10px',
//               boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
//             }}>
//               <select>
//                 <option>Cabai Merah</option>
//                 <option>Beras</option>
//                 <option>Daging</option>
//               </select>

//               <input type="date" />
//             </div>

//             {/* 🔥 LEGEND KANAN */}
//             <div style={{
//               position: 'absolute',
//               top: 10,
//               right: 10,
//               background: 'rgba(255,255,255,0.9)',
//               padding: '10px',
//               borderRadius: '10px',
//               boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
//             }}>
//               <h4 style={{ margin: 0 }}>Legend</h4>
//               <div><span style={{color:'green'}}>●</span> Murah</div>
//               <div><span style={{color:'orange'}}>●</span> Sedang</div>
//               <div><span style={{color:'red'}}>●</span> Mahal</div>
//             </div>

//             {/* 🔥 OVERLAY CONTROL */}
//             <div style={{
//               position: 'absolute',
//               top: 120,
//               right: 10,
//               background: 'rgba(255,255,255,0.9)',
//               padding: '8px',
//               borderRadius: '10px',
//               boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
//             }}>
//               <label>
//                 <input type="checkbox" /> Overlay Peta Lahan
//               </label>
//             </div>

//             {/* 🔥 INFO POPUP (SIMULASI) */}
//             <div style={{
//               position: 'absolute',
//               bottom: 20,
//               left: '50%',
//               transform: 'translateX(-50%)',
//               background: 'rgba(0,0,0,0.7)',
//               color: 'white',
//               padding: '10px',
//               borderRadius: '10px'
//             }}>
//               Pasar Wonokromo <br />
//               Harga Cabai Merah: Rp 30.000/kg
//             </div>

//             {/* 🔥 TIME SLIDER */}
//             <div style={{
//               position: 'absolute',
//               bottom: 10,
//               left: 10,
//               right: 10,
//               background: 'rgba(255,255,255,0.9)',
//               padding: '10px',
//               borderRadius: '10px'
//             }}>
//               <input type="range" min="1" max="30" style={{ width: '100%' }} />
//               <div style={{ textAlign: 'center' }}>April 2024</div>
//             </div>

//           </div>

//         </Container>
//       </Section>
//     </Layout>
//   );
// }
// import Head from 'next/head';
// import Map from '@components/Map';
// import styles from '@styles/Home.module.scss';

// export default function Home() {
//   return (
//     <>
//       <Head>
//         <title>Dashboard Harga Komoditas</title>
//         <meta name="description" content="Komoditas Pangan Jawa Timur" />
//       </Head>

//       <div className={styles.container}>

//         {/* HEADER */}
//         <div className={styles.header}>
//           🥬 Dashboard Harga Komoditas Pangan Jawa Timur 🌾
//         </div>

//         {/* TOP FILTER */}
//         <div className={styles.topFilter}>
//           <select>
//             <option>Cabai Merah</option>
//             <option>Beras</option>
//             <option>Daging Ayam</option>
//           </select>

//           <input type="date" />
//         </div>

//         {/* MAIN */}
//         <div className={styles.main}>

//           {/* SIDEBAR */}
//           <div className={styles.sidebar}>
//             <h3>📍 Filter</h3>

//             <label>Komoditas</label>
//             <select>
//               <option>Cabai</option>
//               <option>Beras</option>
//               <option>Telur</option>
//             </select>

//             <label style={{ marginTop: '10px' }}>Tanggal</label>
//             <input type="date" />
//           </div>

//           {/* MAP */}
//           <div className={styles.mapSection}>
//             <div className={styles.mapContainer}>
//               <Map />
//             </div>

//             {/* LEGEND */}
//             <div className={styles.legend}>
//               <h4>Legend</h4>
//               <div><span className={styles.green}></span> Murah</div>
//               <div><span className={styles.yellow}></span> Sedang</div>
//               <div><span className={styles.orange}></span> Tinggi</div>
//               <div><span className={styles.red}></span> Sangat Tinggi</div>
//             </div>

//             {/* OVERLAY */}
//             <div className={styles.overlay}>
//               <label>
//                 <input type="checkbox" /> Overlay Peta Lahan
//               </label>
//             </div>
//           </div>

//         </div>

//         {/* SLIDER */}
//         <div className={styles.slider}>
//           <input type="range" min="1" max="30" />
//           <div>April 2024</div>
//         </div>

//       </div>
//     </>
//   );
// }
// import Head from 'next/head';

// import Layout from '@components/Layout';
// import Section from '@components/Section';
// import Container from '@components/Container';
// import Map from '@components/Map';
// import Button from '@components/Button';

// import styles from '@styles/Home.module.scss';

// const DEFAULT_CENTER = [38.907132, -77.036546]

// export default function Home() {
//   return (
//     <Layout>
//       <Head>
//         <title>Dashboard Harga Komoditas</title>
//         <meta name="description" content="Komoditas Pangan Jawa Timur" />
//         <link rel="icon" href="/favicon.ico" />
//       </Head>

//       <Section>
//         <Container>
//           <h3 className={styles.title}>
//             Dashboard Harga Komoditas Jawa Timur
//           </h3>

//           <Map className={styles.homeMap} width="800" height="400" center={DEFAULT_CENTER} zoom={12}>
//             {({ TileLayer, Marker, Popup }) => (
//               <>
//                 <TileLayer
//                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                   attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
//                 />
//                 <Marker position={DEFAULT_CENTER}>
//                   <Popup>
//                     A pretty CSS3 popup. <br /> Easily customizable.
//                   </Popup>
//                 </Marker>
//               </>
//             )}
//           </Map>

//           {/* <p className={styles.description}>
//             <code className={styles.code}>npx create-next-app -e https://github.com/colbyfayock/next-leaflet-starter</code>
//           </p> */}

//           {/* <p className={styles.view}>
//             <Button href="https://github.com/colbyfayock/next-leaflet-starter">Vew on GitHub</Button>
//           </p> */}
//         </Container>
//       </Section>
//     </Layout>
//   )
// }
