import { useEffect, useState, useRef, useCallback } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import GeoAgriLayout from "@components/GeoAgriLayout";
import StatCard from "@components/UI/StatCard";
import Panel from "@components/UI/Panel";
import Spinner from "@components/UI/Spinner";

const Chart = dynamic(() => import("react-chartjs-2").then(m => m.Chart), { ssr: false });

const api = (url) => fetch(url).then(r => r.json());

export default function AnalisisNull() {
  const [stats, setStats] = useState({});
  const [timelineData, setTimelineData] = useState(null);
  const [donutData, setDonutData] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [batches, setBatches] = useState([]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api("/api/komoditas/null-stats");
      if (res.status === "success") setStats(res.data || {});
    } catch (e) { console.error(e); }
  }, []);

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await api("/api/komoditas/null-timeline?days=7");
      if (res.status !== "success") return;
      const data = res.data || [];
      const labels = data.map(d => d.label);
      setTimelineData({
        labels,
        datasets: [
          { type: "bar", label: "% NULL", data: data.map(d => d.null_pct), backgroundColor: data.map(d => d.null_pct > 8 ? "rgba(220,38,38,.3)" : d.null_pct > 6 ? "rgba(234,88,12,.3)" : "rgba(45,59,222,.2)"), borderColor: data.map(d => d.null_pct > 8 ? "#dc2626" : d.null_pct > 6 ? "#ea580c" : "#2d3bde"), borderWidth: 1.5, borderRadius: 4, order: 2 },
          { type: "line", label: "Stability Index", data: data.map(d => d.stability), borderColor: "#2d3bde", borderWidth: 2, pointRadius: 3, pointBackgroundColor: "#2d3bde", fill: false, tension: .4, yAxisID: "y1", order: 1 },
        ]
      });
    } catch (e) { console.error(e); }
  }, []);

  const fetchDonut = useCallback(async () => {
    try {
      const res = await api("/api/komoditas/null-by-komoditas");
      if (res.status !== "success") return;
      const items = res.data || [];
      const top = items[0] || {};
      setDonutData({
        labels: items.map(d => d.label),
        datasets: [{
          data: items.map(d => d.pct),
          backgroundColor: items.map(d => d.color),
          borderWidth: 0, hoverOffset: 6,
        }]
      });
      return { topLabel: top.label, topValue: top.pct };
    } catch (e) { console.error(e); }
  }, []);

  const fetchProgress = useCallback(async () => {
    try { const res = await api("/api/komoditas/null-by-pasar?per_page=8"); if (res.status === "success") setProgressData(res.data || []); } catch (e) { console.error(e); }
  }, []);

  const fetchBatches = useCallback(async () => {
    try { const res = await api("/api/komoditas/null-batches?limit=4"); if (res.status === "success") setBatches(res.data || []); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchStats(); fetchTimeline(); fetchDonut(); fetchProgress(); fetchBatches(); }, [fetchStats, fetchTimeline, fetchDonut, fetchProgress, fetchBatches]);

  const [centerValue, setCenterValue] = useState({ label: "—", value: 0 });

  useEffect(() => {
    if (donutData && donutData.datasets?.[0]?.data?.length) {
      const items = donutData.labels.map((l, i) => ({ label: l, value: donutData.datasets[0].data[i] }));
      const top = items.reduce((a, b) => (a.value > b.value ? a : b), items[0]);
      setCenterValue({ label: top.label, value: top.value });
    }
  }, [donutData]);

  const timelineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: "Sora", size: 11 }, color: "#9ca3af" } },
      y: { grid: { color: "rgba(0,0,0,.04)" }, ticks: { callback: v => v + "%", font: { family: "DM Mono", size: 11 }, color: "#9ca3af" } },
      y1: { position: "right", display: false, min: 80, max: 100 }
    }
  };

  const donutOptions = {
    responsive: false, cutout: "72%",
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}%` } } },
  };

  return (
    <GeoAgriLayout title="Analisis NULL">
      <Head><title>Analisis NULL — GeoAgri</title></Head>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.6px", color: "var(--text)" }}>Analisis Integritas Data</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>Audit kualitas data hasil scraping harian dari berbagai pasar komoditas.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard label="Overall Completion" value={stats.completion_rate ? `${stats.completion_rate}%` : "—"} color="#2d3bde" sub={<span style={{ color: "var(--text-muted)" }}>{stats.completion_rate >= 80 ? "Baik" : "Perlu perhatian"}</span>} />
        <StatCard label="Total Missing Values" value={stats.total_null?.toLocaleString() || "—"} color="#dc2626" sub={<span style={{ color: "var(--text-muted)" }}>dari {stats.total_records?.toLocaleString()} total records</span>} />
        <StatCard label="Scraping Stability" value={stats.stability_label || "—"} color="#16a34a" sub={<span style={{ color: "var(--text-muted)" }}>{stats.stability_desc}</span>} />
        <StatCard label="Waktu Terakhir Scan" value={stats.last_scan_time || "—"} color="#6b7280" sub={<span style={{ color: "var(--text-muted)" }}>Data terakhir tersedia</span>} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 20, alignItems: "start" }}>
        <Panel title="Persentase NULL per Tanggal">
          <div style={{ height: 200, position: "relative" }}>
            {timelineData ? <Chart type="bar" data={timelineData} options={timelineOptions} /> : <Spinner />}
          </div>
        </Panel>
        <Panel title="Persentase NULL per Komoditas">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ height: 200, width: 200 }}>
              {donutData ? <Chart type="doughnut" data={donutData} options={donutOptions} /> : <Spinner />}
            </div>
            {donutData && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginTop: 16, width: "100%" }}>
                {donutData.labels.slice(0, 6).map((label, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-muted)" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: donutData.datasets[0].backgroundColor[i], flexShrink: 0 }} />
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel title="Persentase NULL per Pasar">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {progressData.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>Tidak ada data</div>
            ) : progressData.map((item, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{item.nama}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--mono)", color: item.color }}>{item.pct}%</span>
                </div>
                <div style={{ height: 6, background: "var(--bg-muted)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, item.pct))}%`, borderRadius: 3, background: item.color, transition: "width .6s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Missing Data Batches">
          <table className="null-table">
            <thead>
              <tr>
                <th>Nama Sumber</th>
                <th>Tanggal Batch</th>
                <th>Jumlah NULL</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>Tidak ada data NULL</td></tr>
              ) : batches.map((item, i) => (
                <tr key={i}>
                  <td><strong>{item.nama}</strong></td>
                  <td style={{ color: "var(--text-muted)" }}>{item.tgl}</td>
                  <td><span className="null-count">{item.null.toLocaleString()}</span> <span className="null-record">Records</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <style jsx global>{`
        .null-table { width: 100%; border-collapse: collapse; }
        .null-table th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--text-muted); text-align: left; padding: 0 0 12px; border-bottom: 1px solid var(--border); }
        .null-table td { padding: 12px 0; font-size: 13px; color: var(--text); border-bottom: 1px solid var(--bg-muted); }
        .null-count { font-weight: 700; font-family: var(--mono); color: #dc2626; }
        .null-record { font-size: 11px; color: var(--text-muted); }
      `}</style>
    </GeoAgriLayout>
  );
}
