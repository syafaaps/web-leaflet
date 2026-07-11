import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";

const api = (url) => fetch(url).then(r => r.json());

export default function LandingPage() {
  const [stats, setStats] = useState({});
  const [komoditasCount, setKomoditasCount] = useState("—");
  const [pasarCount, setPasarCount] = useState("—");

  useEffect(() => {
    api("/api/komoditas/null-stats").then(res => {
      if (res.status === "success") setStats(res.data || {});
    }).catch(() => {});
    api("/api/master/komoditas").then(res => {
      if (res.status === "success") setKomoditasCount((res.data || []).length);
    }).catch(() => {});
    api("/api/master/pasar").then(res => {
      if (res.status === "success") setPasarCount((res.data || []).length);
    }).catch(() => {});
  }, []);

  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("geoagri_token");
    if (token) {
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(json => { if (json?.status === "success") setAuthUser(json.data); })
        .catch(() => {});
    }
  }, []);

  return (
    <>
      <Head>
        <title>GeoAgri Portal</title>
      </Head>
      <div className="landing">
        <header className="landing-header">
          <div className="landing-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            GeoAgri
          </div>
          <nav className="landing-nav">
            <a href="#dashboard" className="landing-nav-link">Dashboard</a>
            <a href="#peta" className="landing-nav-link">Peta</a>
            <a href="#ringkasan" className="landing-nav-link">Ringkasan</a>
            {authUser ? (
              <a href="/dashboard" className="landing-nav-link" style={{ color: "#155233", fontWeight: 700 }}>
                Dashboard →
              </a>
            ) : (
              <a href="/login" className="landing-nav-link" style={{ color: "#155233", fontWeight: 700 }}>
                Login
              </a>
            )}
          </nav>
        </header>

        <section className="landing-hero">
          <h1 className="landing-hero-title">Platform Monitoring Harga Komoditas</h1>
          <p className="landing-hero-desc">
            Pantau, analisis, dan visualisasikan data harga komoditas dari seluruh pasar di Indonesia.
          </p>
        </section>

        <section className="landing-cards" id="dashboard">
          <div className="landing-card landing-card-primary" onClick={() => window.location = "/dashboard"}>
            <div className="landing-card-icon">📊</div>
            <h3 className="landing-card-title">Dashboard</h3>
            <p className="landing-card-desc">Analisis harga, statistik NULL, tren komoditas, dan scraping log.</p>
            <span className="landing-card-btn">Buka Dashboard →</span>
          </div>

          <div className="landing-card landing-card-secondary" id="peta" onClick={() => window.location = "/peta-komoditas"}>
            <div className="landing-card-icon">🗺️</div>
            <h3 className="landing-card-title">Peta Komoditas</h3>
            <p className="landing-card-desc">Visualisasi sebaran harga interaktif per provinsi dan kabupaten.</p>
            <span className="landing-card-btn">Buka Peta →</span>
          </div>

          <div className="landing-card landing-card-tertiary" id="ringkasan">
            <div className="landing-card-icon">📈</div>
            <h3 className="landing-card-title">Ringkasan</h3>
            <div className="landing-summary">
              <div className="landing-summary-item">
                <span className="landing-summary-value">{pasarCount}</span>
                <span className="landing-summary-label">Pasar</span>
              </div>
              <div className="landing-summary-item">
                <span className="landing-summary-value">{komoditasCount}</span>
                <span className="landing-summary-label">Komoditas</span>
              </div>
              <div className="landing-summary-item">
                <span className="landing-summary-value">{stats.total_records?.toLocaleString() || "—"}</span>
                <span className="landing-summary-label">Data Record</span>
              </div>
              <div className="landing-summary-item">
                <span className="landing-summary-value">{stats.completion_rate ? `${stats.completion_rate}%` : "—"}</span>
                <span className="landing-summary-label">Completion</span>
              </div>
            </div>
            <span className="landing-card-badge">Terkini</span>
          </div>
        </section>

        <footer className="landing-footer">
          {/* Dibangun oleh Tim GeoAgri © 2024 */}
        </footer>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Sora', sans-serif; background: #f8f9fc; color: #111827; }

        .landing { min-height: 100vh; display: flex; flex-direction: column; }
        .landing-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 40px; background: #fff; border-bottom: 1px solid #e5e7eb;
        }
        .landing-logo {
          display: flex; align-items: center; gap: 8px;
          font-size: 18px; font-weight: 800; color: #155233; letter-spacing: -.3px;
        }
        .landing-nav { display: flex; gap: 24px; }
        .landing-nav-link {
          font-size: 13px; font-weight: 600; color: #6b7280;
          text-decoration: none; transition: color .15s;
        }
        .landing-nav-link:hover { color: #155233; }

        .landing-hero {
          text-align: center; padding: 64px 40px 40px;
        }
        .landing-hero-title {
          font-size: 32px; font-weight: 800; letter-spacing: -.8px;
          color: #111827;
        }
        .landing-hero-desc {
          font-size: 15px; color: #6b7280; margin-top: 8px; max-width: 480px; margin-inline: auto;
        }

        .landing-cards {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 20px; max-width: 960px; margin: 0 auto; padding: 20px 40px 60px;
        }
        .landing-card {
          background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
          padding: 28px 24px; cursor: pointer;
          transition: all .2s ease; display: flex; flex-direction: column;
          position: relative; box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }
        .landing-card:hover {
          transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,.1);
        }
        .landing-card-primary { border-top: 3px solid #155233; }
        .landing-card-secondary { border-top: 3px solid #7c3aed; }
        .landing-card-tertiary { border-top: 3px solid #16a34a; cursor: default; }
        .landing-card-icon { font-size: 32px; margin-bottom: 12px; }
        .landing-card-title { font-size: 17px; font-weight: 700; color: #111827; margin-bottom: 8px; }
        .landing-card-desc { font-size: 13px; color: #6b7280; line-height: 1.5; flex: 1; }
        .landing-card-btn {
          display: inline-flex; align-items: center; gap: 4px;
          margin-top: 16px; font-size: 13px; font-weight: 700; color: #155233;
          transition: gap .15s;
        }
        .landing-card:hover .landing-card-btn { gap: 8px; }
        .landing-card-badge {
          position: absolute; top: 12px; right: 12px;
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px;
          background: rgba(22,163,74,.1); color: #16a34a;
          padding: 3px 8px; border-radius: 20px;
        }

        .landing-summary {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 4px;
        }
        .landing-summary-item { text-align: center; }
        .landing-summary-value {
          display: block; font-family: 'DM Mono', monospace;
          font-size: 20px; font-weight: 700; color: #111827;
        }
        .landing-summary-label {
          font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; margin-top: 2px;
        }

        .landing-footer {
          margin-top: auto; text-align: center;
          padding: 20px; font-size: 12px; color: #9ca3af; font-weight: 500;
        }

        @media (max-width: 768px) {
          .landing-cards { grid-template-columns: 1fr; }
          .landing-header { padding: 16px 20px; }
          .landing-hero { padding: 40px 20px 24px; }
          .landing-hero-title { font-size: 24px; }
          .landing-cards { padding: 16px 20px 40px; }
        }
      `}</style>
    </>
  );
}
