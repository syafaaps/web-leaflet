import { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import GeoAgriLayout from "@components/GeoAgriLayout";
import StatCard from "@components/UI/StatCard";
import GrafanaEmbed from "@components/UI/GrafanaEmbed";

const Chart = dynamic(() => import("react-chartjs-2").then(m => m.Chart), { ssr: false });

const api = (url) => fetch(url).then(r => r.json());
const fmt = (n) => n != null ? "Rp " + Number(n).toLocaleString("id-ID") : "—";
const fmtShort = (n) => n != null ? "Rp" + (n / 1000).toFixed(0) + "k" : "—";

const toDate = (d) => d.toISOString().slice(0, 10);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [komoditasList, setKomoditasList] = useState([]);
  const [selectedKomoditas, setSelectedKomoditas] = useState(null);
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [range, setRange] = useState(30);

  useEffect(() => {
    const to = new Date();
    const from = new Date(Date.now() - 30 * 86400000);
    setTanggalMulai(toDate(from));
    setTanggalSelesai(toDate(to));
  }, []);

  useEffect(() => {
    Promise.all([
      api("/api/master/komoditas"),
      api("/api/dashboard"),
    ]).then(([kom, dash]) => {
      setKomoditasList(kom.data || []);
      if (dash.status === "success") setData(dash.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const komoditasOpts = komoditasList.map(k => ({ value: String(k.id), label: k.nama }));
  const ls = data?.last_scrape;

  const chartData = useMemo(() => {
    if (!data?.trend?.length) return null;
    const labels = data.trend.map(d => {
      const dt = new Date(d.tanggal + "T00:00:00");
      return dt.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    });
    const prices = data.trend.map(d => d.harga);
    return {
      labels,
      datasets: [{
        label: "Rata-rata Nasional",
        data: prices,
        borderColor: "#155233",
        backgroundColor: (ctx) => {
          if (!ctx.chart?.ctx) return "rgba(21,82,51,0.08)";
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 240);
          g.addColorStop(0, "rgba(21,82,51,0.15)");
          g.addColorStop(1, "rgba(21,82,51,0)");
          return g;
        },
        fill: true,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.4,
      }]
    };
  }, [data]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#111827",
        bodyColor: "#6b7280",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 10,
        callbacks: { label: (ctx) => fmt(ctx.parsed.y) }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#9ca3af", maxTicksLimit: 12 } },
      y: { grid: { color: "rgba(0,0,0,.04)" }, border: { dash: [4, 4] }, ticks: { font: { size: 11 }, color: "#9ca3af", callback: v => fmtShort(v) } }
    }
  };

  return (
    <GeoAgriLayout title="Dashboard">
      <Head><title>Dashboard — GeoAgri</title></Head>

      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-desc">Monitoring ringkas data harga komoditas pertanian nasional.</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: "var(--text-muted)", fontSize: 13 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite", marginRight: 8 }}>
            <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
          </svg>
          Memuat data...
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
            <StatCard label="Total Komoditas" value={data?.total_komoditas ?? "—"} color="#155233" />
            <StatCard label="Total Provinsi" value={data?.total_provinsi ?? "—"} color="#2d3bde" />
            <StatCard label="Total Kab/Kota" value={data?.total_kabkota ?? "—"} color="#7c3aed" />
            <StatCard label="Total Pasar" value={data?.total_pasar ?? "—"} color="#ea580c" />
            <StatCard label="Update Scraping" value={ls?.finished_at ? new Date(ls.finished_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"} color="#0891b2" sub={ls ? `${ls.total_data} data · ${ls.total_pasar} pasar` : ""} />
          </div>

          {/* ── FILTER BAR ── */}
          <div className="geo-card" style={{ padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filter Grafana:
            </span>

            <select
              value={selectedKomoditas || ""}
              onChange={e => setSelectedKomoditas(e.target.value || null)}
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, background: "var(--bg)", color: "var(--text)", cursor: "pointer", minWidth: 160 }}
            >
              <option value="">Semua Komoditas</option>
              {komoditasOpts.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <input type="date" value={tanggalMulai} onChange={e => { setTanggalMulai(e.target.value); setRange(0); }}
                style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, background: "var(--bg)", color: "var(--text)" }} />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>s.d.</span>
              <input type="date" value={tanggalSelesai} onChange={e => { setTanggalSelesai(e.target.value); setRange(0); }}
                style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, background: "var(--bg)", color: "var(--text)" }} />
            </div>

            <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
              {[7, 30, 90].map(r => (
                <button key={r}
                  onClick={() => { setRange(r); setTanggalMulai(""); setTanggalSelesai(""); }}
                  style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border)", background: range === r && !tanggalMulai ? "var(--primary, #155233)" : "var(--bg)", color: range === r && !tanggalMulai ? "#fff" : "var(--text-muted)", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                  {r} Hari
                </button>
              ))}
            </div>
          </div>

          <div className="geo-card" style={{ padding: "22px 24px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Tren Harga Nasional</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {selectedKomoditas ? komoditasOpts.find(o => o.value === selectedKomoditas)?.label : "Rata-rata seluruh komoditas"}
                  {" · "}
                  {tanggalMulai && tanggalSelesai
                    ? `${tanggalMulai} s.d. ${tanggalSelesai}`
                    : `${range} hari terakhir`}
                </div>
              </div>
            </div>
            <div style={{ height: 280, position: "relative" }}>
              {chartData ? (
                <Chart type="line" data={chartData} options={chartOptions} />
              ) : (
                <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)", fontSize: 13 }}>
                  Belum ada data tren.
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div className="geo-card" style={{ padding: "22px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                Kenaikan Terbesar
              </div>
              {data?.gainers?.length ? (
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Komoditas</th>
                      <th style={{ textAlign: "right" }}>Harga Awal</th>
                      <th style={{ textAlign: "right" }}>Harga Akhir</th>
                      <th style={{ textAlign: "right" }}>Naik</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.gainers.map((item, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{item.komoditas}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{fmt(item.harga_awal)}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{fmt(item.harga_akhir)}</td>
                        <td className="mono" style={{ textAlign: "right", color: "#16a34a", fontWeight: 700 }}>+{item.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>Belum ada data.</div>
              )}
            </div>

            <div className="geo-card" style={{ padding: "22px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                  <polyline points="17 18 23 18 23 12" />
                </svg>
                Penurunan Terbesar
              </div>
              {data?.losers?.length ? (
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Komoditas</th>
                      <th style={{ textAlign: "right" }}>Harga Awal</th>
                      <th style={{ textAlign: "right" }}>Harga Akhir</th>
                      <th style={{ textAlign: "right" }}>Turun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.losers.map((item, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{item.komoditas}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{fmt(item.harga_awal)}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{fmt(item.harga_akhir)}</td>
                        <td className="mono" style={{ textAlign: "right", color: "#dc2626", fontWeight: 700 }}>{item.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>Belum ada data.</div>
              )}
            </div>
          </div>

          <div className="geo-card" style={{ padding: "22px 24px", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>
              Tren Harga (Grafana)
            </div>
            <GrafanaEmbed
              panelId="panel-2"
              komoditasIds={selectedKomoditas ? [selectedKomoditas] : []}
              from={tanggalMulai}
              to={tanggalSelesai}
              range={range}
              tab="analisis-tren-harga-komoditas"
            />
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .dash-table { width: 100%; border-collapse: collapse; }
        .dash-table th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--text-muted); text-align: left; padding: 0 6px 10px; border-bottom: 1px solid var(--border); white-space: nowrap; }
        .dash-table td { padding: 8px 6px; font-size: 13px; color: var(--text); border-bottom: 1px solid var(--bg-muted); vertical-align: middle; }
        .mono { font-family: var(--mono); font-weight: 600; font-size: 12px; }
      `}</style>
    </GeoAgriLayout>
  );
}
