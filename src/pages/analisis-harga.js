import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import GeoAgriLayout from "@components/GeoAgriLayout";
import Badge from "@components/UI/Badge";

const Chart = dynamic(() => import("react-chartjs-2").then(m => m.Chart), { ssr: false });

const api = (url) => fetch(url).then(r => r.json());
const fmt = (n) => n != null ? "Rp " + Number(n).toLocaleString("id-ID") : "—";
const fmtShort = (n) => n != null ? "Rp" + (n / 1000).toFixed(0) + "k" : "—";
const colors = ["#2d3bde", "#16a34a", "#ea580c", "#7c3aed", "#0891b2", "#d97706", "#be185d", "#65a30d"];

export default function AnalisisHarga() {
  const [view, setView] = useState("tren");
  const [komoditas, setKomoditas] = useState([]);
  const [provinsiList, setProvinsiList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [provA, setProvA] = useState("");
  const [provB, setProvB] = useState("");
  const [range, setRange] = useState(30);

  const [trenData, setTrenData] = useState(null);
  const [provData, setProvData] = useState([]);
  const [stats, setStats] = useState(null);
  const [volatility, setVolatility] = useState(null);
  const [tren7, setTren7] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadMaster = useCallback(async () => {
    const [kRes, pRes] = await Promise.all([
      api("/api/master/komoditas"),
      api("/api/master/provinsi"),
    ]);
    const items = kRes.data || [];
    setKomoditas(items);
    setProvinsiList(pRes.data || []);
    if (items.length) setSelectedId(String(items[0].id));
  }, []);

  const loadTren = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - range * 86400000).toISOString().slice(0, 10);
    try {
      const res = await api(`/api/komoditas/tren?komoditas_id=${selectedId}&from=${from}&to=${to}`);
      if (res.status !== "success") return;
      const d = res.data || [];
      const labels = d.map(x => { const dt = new Date(x.tanggal); return dt.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }); });
      const values = d.map(x => x.harga);
      const kom = komoditas.find(k => String(k.id) === selectedId);
      const satuan = kom ? `/${kom.satuan || "kg"}` : "";
      setTrenData({
        labels,
        datasets: [{
          label: `Harga ${satuan}`,
          data: values,
          borderColor: "#2d3bde",
          backgroundColor: (ctx) => { const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 250); g.addColorStop(0, "rgba(45,59,222,.25)"); g.addColorStop(1, "rgba(45,59,222,0)"); return g; },
          fill: true, borderWidth: 2.5, pointRadius: 2, pointHoverRadius: 6, tension: .4,
        }]
      });

      if (d.length >= 2) {
        const last7 = d.slice(-7).map(x => x.harga).filter(Boolean);
        if (last7.length >= 2) {
          const pct = ((last7[last7.length - 1] - last7[0]) / last7[0] * 100).toFixed(1);
          setTren7(pct);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [selectedId, range, komoditas]);

  const loadPerProvinsi = useCallback(async () => {
    if (!selectedId) return;
    try {
      const res = await api(`/api/komoditas/per-provinsi?komoditas_id=${selectedId}`);
      if (res.status !== "success") return;
      setProvData(res.data || []);
      setStats(res.statistik || null);

      const hargaList = (res.data || []).map(x => x.harga).filter(h => h != null);
      if (hargaList.length > 1) {
        const mean = hargaList.reduce((a, b) => a + b, 0) / hargaList.length;
        const variance = hargaList.reduce((s, v) => s + (v - mean) ** 2, 0) / hargaList.length;
        const std = Math.sqrt(variance);
        setVolatility({ cv: (std / mean) * 100, std, mean });
      }
    } catch (e) { console.error(e); }
  }, [selectedId]);

  useEffect(() => { loadMaster(); }, [loadMaster]);
  useEffect(() => { if (selectedId) { loadTren(); loadPerProvinsi(); } }, [selectedId, loadTren, loadPerProvinsi]);
  useEffect(() => { if (view === "tren" && selectedId) loadTren(); }, [range, view]);

  const trendOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#fff", titleColor: "#111827", bodyColor: "#6b7280", borderColor: "#e5e7eb", borderWidth: 1, padding: 10, callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.raw)}` } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: "Sora", size: 11 }, color: "#9ca3af", maxTicksLimit: 10 } },
      y: { grid: { color: "rgba(0,0,0,.04)" }, border: { dash: [4, 4] }, ticks: { font: { family: "DM Mono", size: 11 }, color: "#9ca3af", callback: v => "Rp " + (v / 1000).toFixed(0) + "k" } }
    }
  };

  const sortedRanking = [...provData].sort((a, b) => (b.harga || 0) - (a.harga || 0));
  const top8 = sortedRanking.slice(0, 8);
  const avgPrice = stats?.rata || 0;

  const barChartData = {
    labels: sortedRanking.slice(0, 12).map(d => d.provinsi),
    datasets: [{
      label: "Harga Rata-rata",
      data: sortedRanking.slice(0, 12).map(d => d.harga),
      backgroundColor: sortedRanking.slice(0, 12).map((d, i) => colors[i % colors.length]),
      borderRadius: 4,
    }]
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    indexAxis: "y",
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => fmt(ctx.raw) } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: "DM Mono", size: 10 }, callback: v => fmtShort(v) } },
      y: { grid: { display: false }, ticks: { font: { family: "Sora", size: 11 } } }
    }
  };

  return (
    <GeoAgriLayout title="Analisis Harga">
      <Head><title>Analisis Harga — GeoAgri</title></Head>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.6px", color: "var(--text)" }}>Analisis Harga Komoditas</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>Pantau pergerakan, bandingkan, dan analisis distribusi harga.</p>
      </div>

      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { key: "tren", label: "Tren Harga", icon: "\u2197\uFE0F" },
          { key: "perbandingan", label: "Perbandingan", icon: "\u2696\uFE0F" },
          { key: "heatmap", label: "Heatmap", icon: "\uD83D\uDD25" },
        ].map(v => (
          <button key={v.key} onClick={() => setView(v.key)}
            style={{ padding: "8px 18px", borderRadius: "var(--radius-sm)", border: `1px solid ${view === v.key ? "var(--primary-20)" : "var(--border)"}`, background: view === v.key ? "var(--primary-10)" : "var(--bg-white)", color: view === v.key ? "var(--primary)" : "var(--text-muted)", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--font)" }}>
            {v.icon} {v.label}
          </button>
        ))}
        <select value={selectedId || ""} onChange={e => setSelectedId(e.target.value)}
          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", padding: "7px 32px 7px 12px", borderRadius: "var(--radius-sm)", fontFamily: "var(--font)", fontSize: 13, fontWeight: 500, cursor: "pointer", appearance: "none",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
          {komoditas.map(k => <option key={k.id} value={k.id}>{k.nama} ({k.satuan || "—"})</option>)}
        </select>
        <select value={provA} onChange={e => setProvA(e.target.value)}
          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", padding: "7px 12px", borderRadius: "var(--radius-sm)", fontFamily: "var(--font)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          <option value="">Provinsi A</option>
          {provinsiList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
        </select>
        <select value={provB} onChange={e => setProvB(e.target.value)}
          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", padding: "7px 12px", borderRadius: "var(--radius-sm)", fontFamily: "var(--font)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          <option value="">Provinsi B</option>
          {provinsiList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
        </select>
        <button onClick={() => { loadTren(); loadPerProvinsi(); }}
          style={{ padding: "7px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg-white)", color: "var(--text)", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font)" }}>
          Refresh
        </button>
      </div>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
          <SummaryCard label="Harga Rata-rata" value={fmt(stats.rata)} sub={avgPrice > 0 ? "Nasional" : ""} />
          <SummaryCard label="Harga Terendah" value={fmt(stats.min)} sub={sortedRanking.length ? sortedRanking[0]?.provinsi : ""} />
          <SummaryCard label="Harga Tertinggi" value={fmt(stats.max)} sub={sortedRanking.length ? sortedRanking[sortedRanking.length - 1]?.provinsi : ""} />
          <SummaryCard label="Volatilitas" value={volatility ? volatility.cv.toFixed(1) + "%" : "—"} sub={volatility ? `\u03C3 = ${Math.round(volatility.std)}` : ""} />
          <SummaryCard label="Tren 7 Hari" value={tren7 ? `${tren7 > 0 ? "+" : ""}${tren7}%` : "—"} sub={tren7 > 0 ? "Naik" : tren7 < 0 ? "Turun" : "Stabil"} color={tren7 > 0 ? "#dc2626" : tren7 < 0 ? "#16a34a" : "var(--text-muted)"} />
        </div>
      )}

      {view === "tren" && (
        <>
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            {[7, 14, 30, 90].map(r => (
              <button key={r} className={`range-btn ${range === r ? "active" : ""}`} onClick={() => setRange(r)}>{r} Hari</button>
            ))}
          </div>

          <div style={{ marginBottom: 16, padding: "14px 18px", borderRadius: "var(--radius-sm)", background: "var(--primary-5)", border: "1px solid var(--primary-20)", fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
            {provData.length > 0 && stats ? (
              <>
                Rata-rata harga nasional <strong>{fmt(stats.rata)}</strong> dengan harga terendah di <strong>{sortedRanking[0]?.provinsi}</strong> ({fmt(stats.min)}) dan tertinggi di <strong>{sortedRanking[sortedRanking.length - 1]?.provinsi}</strong> ({fmt(stats.max)}).
                Selisih harga antar provinsi mencapai <strong>{fmt(stats.max - stats.min)}</strong>.
                {volatility && volatility.cv > 30 ? " Volatilitas harga tergolong tinggi." : volatility && volatility.cv < 15 ? " Volatilitas harga tergolong rendah." : ""}
              </>
            ) : "Pilih komoditas untuk melihat analisis."}
          </div>

          <div className="geo-card" style={{ padding: "22px 24px", marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Grafik Tren Harga</div>
            <div style={{ height: 280, position: "relative" }}>
              {trenData ? <Chart type="line" data={trenData} options={trendOptions} /> : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>{loading ? "Memuat..." : "Tidak ada data"}</div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div className="geo-card" style={{ padding: "22px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Peringkat Harga per Provinsi</div>
              {top8.length === 0 ? <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Tidak ada data</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {top8.map((d, i) => {
                    const diff = d.harga - avgPrice;
                    return (
                      <div key={d.provinsi_id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 20, fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textAlign: "right" }}>#{i + 1}</span>
                        <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{d.provinsi}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{fmt(d.harga)}</div>
                        <span style={{ fontSize: 11, fontFamily: "var(--mono)", fontWeight: 600, color: diff > 0 ? "#dc2626" : diff < 0 ? "#16a34a" : "var(--text-muted)" }}>
                          {diff > 0 ? "+" : ""}{fmt(diff)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="geo-card" style={{ padding: "22px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Volatilitas Harga (CV%)</div>
              {sortedRanking.length === 0 ? <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Tidak ada data</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {sortedRanking.slice(0, 8).map(d => {
                    const pct = avgPrice ? ((d.harga - avgPrice) / avgPrice * 100) : 0;
                    const barW = Math.min(Math.abs(pct) / 50 * 100, 100);
                    return (
                      <div key={d.provinsi_id}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                          <span style={{ fontWeight: 600, color: "var(--text)" }}>{d.provinsi}</span>
                          <span style={{ fontFamily: "var(--mono)", fontWeight: 600, color: pct > 0 ? "#dc2626" : "#16a34a" }}>{pct > 0 ? "+" : ""}{pct.toFixed(1)}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: "var(--bg)", overflow: "hidden" }}>
                          <div style={{ width: `${barW}%`, height: "100%", borderRadius: 3, background: pct > 0 ? "#fca5a5" : "#86efac" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="geo-card" style={{ padding: "22px 24px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Perbandingan Harga per Provinsi</div>
            {sortedRanking.length > 0 && (
              <div style={{ height: 220, position: "relative" }}>
                <Chart type="bar" data={barChartData} options={barOptions} />
              </div>
            )}
          </div>
        </>
      )}

      {view === "perbandingan" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div className="geo-card" style={{ padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".5px" }}>
                {provA ? (provinsiList.find(p => String(p.id) === provA)?.nama || "Provinsi A") : "Provinsi A"}
              </div>
              {provA ? (
                <>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)", marginBottom: 4 }}>
                    {fmt(sortedRanking.find(d => String(d.provinsi_id) === provA)?.harga)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {sortedRanking.find(d => String(d.provinsi_id) === provA) ? "Data tersedia" : "Pilih provinsi A"}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Pilih provinsi untuk perbandingan</div>
              )}
            </div>
            <div className="geo-card" style={{ padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".5px" }}>Nasional</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)", marginBottom: 4 }}>{fmt(stats?.rata)}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Rata-rata {provData.length} provinsi</div>
            </div>
            <div className="geo-card" style={{ padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".5px" }}>
                {provB ? (provinsiList.find(p => String(p.id) === provB)?.nama || "Provinsi B") : "Provinsi B"}
              </div>
              {provB ? (
                <>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)", marginBottom: 4 }}>
                    {fmt(sortedRanking.find(d => String(d.provinsi_id) === provB)?.harga)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {sortedRanking.find(d => String(d.provinsi_id) === provB) ? "Data tersedia" : "Pilih provinsi B"}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Pilih provinsi untuk perbandingan</div>
              )}
            </div>
          </div>
          {provA && provB && (
            <div className="geo-card" style={{ padding: "22px 24px" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Perbandingan Antar Provinsi</div>
              <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                {(() => {
                  const dA = sortedRanking.find(d => String(d.provinsi_id) === provA);
                  const dB = sortedRanking.find(d => String(d.provinsi_id) === provB);
                  if (!dA || !dB) return null;
                  const diff = dA.harga - dB.harga;
                  const pct = dB.harga ? ((diff / dB.harga) * 100).toFixed(1) : "—";
                  return (
                    <>
                      <div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Selisih Harga</div>
                        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--mono)", color: diff > 0 ? "#dc2626" : "#16a34a" }}>{diff > 0 ? "+" : ""}{fmt(diff)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Persentase</div>
                        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--mono)", color: diff > 0 ? "#dc2626" : "#16a34a" }}>{pct}%</div>
                      </div>
                    </>
                  );
                })()}
              </div>
              {trenData && (
                <div style={{ height: 240, position: "relative" }}>
                  <Chart type="line" data={trenData} options={trendOptions} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {view === "heatmap" && (
        <div className="geo-card" style={{ padding: "22px 24px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Distribusi Harga per Provinsi</div>
          {provData.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Tidak ada data</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".8px", fontFamily: "Sora,sans-serif", borderBottom: "1px solid var(--border)" }}>Provinsi</th>
                    <th style={{ textAlign: "center", padding: "8px 12px", color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".8px", fontFamily: "Sora,sans-serif", borderBottom: "1px solid var(--border)" }}>Harga</th>
                    <th style={{ textAlign: "center", padding: "8px 12px", color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".8px", fontFamily: "Sora,sans-serif", borderBottom: "1px solid var(--border)" }}>Deviasi</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRanking.map(d => {
                    const dev = avgPrice ? ((d.harga - avgPrice) / avgPrice * 100) : 0;
                    const intensity = Math.min(Math.abs(dev) / 50, 1);
                    const bgColor = dev > 0 ? `rgba(220,38,38,${intensity * 0.3})` : dev < 0 ? `rgba(22,163,74,${intensity * 0.3})` : "transparent";
                    return (
                      <tr key={d.provinsi_id} style={{ borderBottom: "1px solid var(--bg-muted)" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--text)" }}>{d.provinsi}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: 700, background: bgColor }}>{fmt(d.harga)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: 600, color: dev > 0 ? "#dc2626" : dev < 0 ? "#16a34a" : "var(--text-muted)" }}>
                          {dev > 0 ? "+" : ""}{dev.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        .range-btn { padding: 6px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg); font-family: var(--font); font-size: 12px; font-weight: 500; color: var(--text-muted); cursor: pointer; }
        .range-btn.active, .range-btn:hover { background: var(--primary-10); color: var(--primary); border-color: var(--primary-20); }
        .geo-card { background: var(--bg-white); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-sm); }
      `}</style>
    </GeoAgriLayout>
  );
}

function SummaryCard({ label, value, sub, color }) {
  return (
    <div className="geo-card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--mono)", color: color || "var(--text)", letterSpacing: "-.5px" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub || ""}</div>
    </div>
  );
}
