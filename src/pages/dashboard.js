import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import GeoAgriLayout from "@components/GeoAgriLayout";
import StatCard from "@components/UI/StatCard";
import FilterBar from "@components/UI/FilterBar";
import GrafanaEmbed from "@components/UI/GrafanaEmbed";

const Chart = dynamic(() => import("react-chartjs-2").then(m => m.Chart), { ssr: false });
const LeafletHeatmapMap = dynamic(() => import("@components/Map/LeafletHeatmapMap"), { ssr: false });

const api = (url) => fetch(url).then(r => r.json());
const fmt = (n) => n ? "Rp " + Number(n).toLocaleString("id-ID") : "—";

let trendChartInstance = null;

export default function DashboardPage() {
  const canvasRef = useRef(null);
  const mapRef = useRef(null);
  const [state, setState] = useState({ komoditas_ids: [], provinsi_ids: [], range: 30 });
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState(null);
  const [komoditasItems, setKomoditasItems] = useState([]);
  const [komoditasIndex, setKomoditasIndex] = useState({});
  const [provinsiItems, setProvinsiItems] = useState([]);
  const [mapData, setMapData] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const loadMaster = useCallback(async () => {
    const [kom, prov] = await Promise.all([
      api("/api/master/komoditas"),
      api("/api/master/provinsi"),
    ]);
    const idx = {};
    kom.data.forEach(k => { idx[k.id] = `${k.nama} (${k.satuan ?? "-"})`; });
    setKomoditasIndex(idx);
    setKomoditasItems(kom.data);
    setProvinsiItems(prov.data ?? []);
    if (kom.data.length) {
      setState(s => ({ ...s, komoditas_ids: [String(kom.data[0].id)] }));
    }
  }, []);

  const loadStats = useCallback(async () => {
    const aktif = state.komoditas_ids[0];
    if (!aktif) return;
    const res = await api(`/api/komoditas/per-provinsi?komoditas_id=${aktif}`);
    if (res.status === "success") {
      setStats(res.meta);
    }
  }, [state.komoditas_ids]);

  const loadTrend = useCallback(async () => {
    const ids = state.komoditas_ids.filter(Boolean);
    if (!ids.length) return;
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - state.range * 86400000).toISOString().slice(0, 10);
    const responses = await Promise.all(ids.map(komoditasId =>
      api(`/api/komoditas/tren?komoditas_id=${komoditasId}&from=${from}&to=${to}`)
    ));
    const series = responses.filter(r => r.status === "success").map((r, i) => ({
      label: komoditasIndex[ids[i]] || `#${ids[i]}`,
      color: ["#155233", "#3aab74", "#16a34a", "#ea580c", "#7c3aed"][i % 5],
      points: r.data.map(d => ({ tanggal: d.tanggal, harga: d.harga })),
    }));
    if (!series.length) return;
    const labelSet = new Set();
    series.forEach(s => s.points.forEach(p => labelSet.add(p.tanggal)));
    const rawLabels = Array.from(labelSet).sort();
    const labels = rawLabels.map(d => new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }));
    const datasets = series.map(s => ({
      label: s.label, data: rawLabels.map(d => { const p = s.points.find(x => x.tanggal === d); return p ? p.harga : null; }),
      borderColor: s.color, backgroundColor: s.color, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, fill: false, tension: 0.45,
    }));
    setChartData({ labels, datasets });
  }, [state.komoditas_ids, state.range, komoditasIndex]);

  const loadMap = useCallback(async () => {
    const aktif = state.komoditas_ids[0];
    if (!aktif) return;
    const tanggal = document.getElementById("filterMapTanggal")?.value || new Date().toISOString().slice(0, 10);
    const res = await api(`/api/komoditas/map?komoditas_id=${aktif}&tanggal=${tanggal}&level=provinsi`);
    setMapData(res);
  }, [state.komoditas_ids]);

  useEffect(() => {
    document.getElementById("filterMapTanggal").value = new Date().toISOString().slice(0, 10);
    loadMaster();
  }, [loadMaster]);

  useEffect(() => { if (state.komoditas_ids[0]) { loadStats(); loadMap(); } }, [state.komoditas_ids, loadStats, loadMap]);
  useEffect(() => { if (state.komoditas_ids.length) loadTrend(); }, [state.komoditas_ids, loadTrend]);

  const mapDataReady = useMemo(() => {
    if (!mapData?.features) return null;
    const aktif = state.komoditas_ids[0];
    const nama = komoditasIndex[aktif] || "";
    return {
      ...mapData,
      features: mapData.features.map(f => ({
        ...f,
        properties: {
          ...f.properties,
          kabupaten: f.properties.nama || f.properties.kabupaten,
          rata_kabupaten: f.properties.harga || f.properties.rata_kabupaten,
          komoditas_nama: nama,
        }
      }))
    };
  }, [mapData, komoditasIndex, state.komoditas_ids]);

  return (
    <GeoAgriLayout title="Dashboard">
      <Head><title>Dashboard — GeoAgri</title></Head>

      <FilterBar>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
          Filter Data:
        </span>
        <select multiple value={state.provinsi_ids}
          onChange={e => {
            const vals = Array.from(e.target.selectedOptions, opt => opt.value);
            setState(s => ({ ...s, provinsi_ids: vals }));
          }}
          className="geo-select geo-select-multi">
          {provinsiItems.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="date" id="filterMapTanggal" className="geo-date-input" onChange={() => loadMap()} />
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[7, 30, 90].map(r => (
            <button key={r} className={`geo-range-btn ${state.range === r ? "active" : ""}`}
              onClick={() => setState(s => ({ ...s, range: r }))}>{r} Hari</button>
          ))}
        </div>
      </FilterBar>

      <div className="komoditas-picker">
        <span className="komoditas-picker-label">Komoditas:</span>
        {komoditasItems.map(k => (
          <button key={k.id} type="button"
            className={`komoditas-chip ${state.komoditas_ids.includes(String(k.id)) ? "active" : ""}`}
            onClick={() => {
              const id = String(k.id);
              setState(s => ({
                ...s,
                komoditas_ids: s.komoditas_ids.includes(id)
                  ? s.komoditas_ids.filter(x => x !== id)
                  : [...s.komoditas_ids, id]
              }));
            }}>
            {k.nama} ({k.satuan ?? "-"})
          </button>
        ))}
        <span className="komoditas-summary">{state.komoditas_ids.length} dipilih</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard label="Total Komoditas" value={stats.total_komoditas} />
        <StatCard label="Total Pasar" value={stats.total_pasar} color="#7c3aed" sub={<span style={{ color: "var(--text-muted)" }}>Nasional</span>} />
        <StatCard label="Data Valid" value={stats.data_valid} color="#16a34a" sub={<span className="geo-badge geo-badge-green">? {stats.data_valid_pct?.toFixed(1)}%</span>} />
        <StatCard label="Data NULL" value={stats.data_null} color="#dc2626" sub={<span className="geo-badge geo-badge-red">Butuh Sinkron</span>} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 20, alignItems: "start" }}>
        <div className="geo-card" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Tren Harga Komoditas Utama</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }} id="chartSub">Pergerakan harga ({state.range} Hari)</div>
            </div>
          </div>
          <div style={{ position: "relative", height: 240 }}>
            {chartData ? (
              <Chart type="line" data={chartData} options={{
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: { legend: { display: true, position: "top" }, tooltip: { backgroundColor: "#fff", titleColor: "#111827", bodyColor: "#6b7280", borderColor: "#e5e7eb", borderWidth: 1, padding: 10, callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.raw)}` } } },
                scales: { x: { grid: { display: false }, ticks: { font: { family: "Sora", size: 11 }, color: "#9ca3af", maxTicksLimit: 8 } }, y: { grid: { color: "rgba(0,0,0,.05)" }, border: { dash: [4, 4] }, ticks: { font: { family: "DM Mono", size: 11 }, color: "#9ca3af", callback: v => "Rp " + (v / 1000).toFixed(0) + "k" } } }
              }} />
            ) : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>Memuat data...</div>}
          </div>
        </div>

        <div className="geo-card" style={{ padding: "22px 20px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Peringatan Harga</div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          {[
            { komoditas: "Cabai Rawit Merah", pct: "+12.5%", pasar: "Pasar Induk Kramat Jati, Jakarta", color: "#dc2626" },
            { komoditas: "Bawang Merah", pct: "+5.2%", pasar: "Pasar Caringin, Bandung", color: "#ea580c" },
            { komoditas: "Daging Sapi", pct: "+8.1%", pasar: "Pasar Wonokromo, Surabaya", color: "#d97706" },
          ].map((item, i) => (
            <div key={i} style={{ borderLeft: "3px solid " + item.color, padding: "10px 12px", borderRadius: "0 var(--radius-sm) var(--radius-sm) 0", background: "var(--bg)", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{item.komoditas}</div>
                <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--mono)", color: item.color }}>{item.pct}</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{item.pasar}</div>
            </div>
          ))}
          <button style={{ width: "100%", justifyContent: "center", marginTop: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid var(--border)", background: "transparent", color: "var(--text)" }}>
            Lihat Semua Laporan
          </button>
        </div>
      </div>

      <div className="geo-card" style={{ padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Tren Harga (Grafana)</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Panel embedded dari Grafana dashboard</div>
          </div>
        </div>
        <GrafanaEmbed
          panelId="panel-2"
          komoditasIds={state.komoditas_ids}
          provinsiIds={state.provinsi_ids}
          range={state.range}
          tab="analisis-tren-harga-komoditas"
        />
      </div>

      <div className="geo-card" style={{ padding: "22px 24px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Distribusi Harga Nasional</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Visualisasi sebaran harga berdasarkan rata-rata provinsi</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>
            <span>SKALA HARGA:</span>
            <div style={{ width: 100, height: 8, borderRadius: 4, background: "linear-gradient(to right, #dcfce7, #fef08a, #fca5a5, #ef4444)" }} />
          </div>
        </div>
        <div style={{ height: 380, borderRadius: "var(--radius-sm)", overflow: "hidden", position: "relative" }}>
          <LeafletHeatmapMap geojsonData={mapDataReady} />
        </div>
      </div>


    </GeoAgriLayout>
  );
}
