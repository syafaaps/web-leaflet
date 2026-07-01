import { useEffect, useState, useRef, useCallback } from "react";
import Head from "next/head";
import GeoAgriLayout from "@components/GeoAgriLayout";
import StatCard from "@components/UI/StatCard";
import FilterBar from "@components/UI/FilterBar";
import Panel from "@components/UI/Panel";
import Spinner from "@components/UI/Spinner";

const api = (url) => fetch(url).then(r => r.json());

function fmtDuration(sec) {
  if (!sec && sec !== 0) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default function ScrapingLog() {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [detail, setDetail] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/scraping/logs?per_page=100";
      if (filterStatus) url += `&status=${filterStatus}`;
      const res = await api(url);
      if (res.status === "success") {
        setLogs(res.data || []);
        setMeta(res.meta || {});
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <GeoAgriLayout title="Scraping Log">
      <Head><title>Scraping Log — GeoAgri</title></Head>

      <div className="page-header">
        <h1 className="page-title">Scraping Log</h1>
        <p className="page-desc">Riwayat dan status proses scraping data harga komoditas.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard label="Total Hari Ini" value={meta.total_hari_ini || "—"} />
        <StatCard label="Sukses" value={meta.total_success || "—"} color="#16a34a" />
        <StatCard label="Gagal" value={meta.total_failed || "—"} color="#dc2626" />
        <StatCard label="Terakhir" value={meta.last_scraping ? new Date(meta.last_scraping).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"} color="#6b7280" />
      </div>

      <FilterBar>
        <div style={{ display: "flex", gap: 4 }}>
          {["", "success", "failed", "running"].map(f => (
            <button key={f} className={`flt-btn ${filterStatus === f ? "active" : ""}`} onClick={() => setFilterStatus(f)}>
              {f === "" ? "Semua" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </FilterBar>

      <Panel title="Riwayat Scraping">
        {loading ? <Spinner /> : (
          <div style={{ overflowX: "auto" }}>
            <table className="log-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Workflow</th>
                  <th>Provinsi</th>
                  <th>Mulai</th>
                  <th>Selesai</th>
                  <th>Durasi</th>
                  <th>Record</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="9" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Tidak ada log</td></tr>
                ) : logs.map((item, i) => (
                  <tr key={item.id || i}>
                    <td className="mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>#{item.id}</td>
                    <td style={{ fontWeight: 600 }}>{item.workflow_name || "—"}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.provinsi?.nama || "—"}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.started_at ? new Date(item.started_at).toLocaleString("id-ID") : "—"}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.finished_at ? new Date(item.finished_at).toLocaleString("id-ID") : "—"}</td>
                    <td className="mono">{fmtDuration(item.duration_seconds)}</td>
                    <td className="mono">{item.total_data || 0}</td>
                    <td>
                      <span className={`st-badge ${item.status}`}>
                        <span className="st-dot" />
                        {item.status === "success" ? "Sukses" : item.status === "failed" ? "Gagal" : "Berjalan"}
                      </span>
                    </td>
                    <td>
                      <button className="dtl-btn" onClick={() => setDetail(item)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Detail Scraping #{detail.id}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{detail.workflow_name}</div>
              </div>
              <button onClick={() => setDetail(null)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "var(--bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13 }}>
              <div><span style={{ color: "var(--text-muted)" }}>Status</span><br /><span className={`st-badge ${detail.status}`}><span className="st-dot" />{detail.status}</span></div>
              <div><span style={{ color: "var(--text-muted)" }}>Provinsi</span><br />{detail.provinsi?.nama || "—"}</div>
              <div><span style={{ color: "var(--text-muted)" }}>Mulai</span><br />{detail.started_at ? new Date(detail.started_at).toLocaleString("id-ID") : "—"}</div>
              <div><span style={{ color: "var(--text-muted)" }}>Selesai</span><br />{detail.finished_at ? new Date(detail.finished_at).toLocaleString("id-ID") : "—"}</div>
              <div><span style={{ color: "var(--text-muted)" }}>Durasi</span><br /><span className="mono">{fmtDuration(detail.duration_seconds)}</span></div>
              <div><span style={{ color: "var(--text-muted)" }}>Total Data</span><br /><span className="mono">{detail.total_data || 0}</span></div>
              <div><span style={{ color: "var(--text-muted)" }}>Insert</span><br /><span className="mono">{detail.total_insert || 0}</span></div>
              <div><span style={{ color: "var(--text-muted)" }}>Skip</span><br /><span className="mono">{detail.total_skip || 0}</span></div>
              <div><span style={{ color: "var(--text-muted)" }}>Pasar</span><br /><span className="mono">{detail.total_pasar || 0}</span></div>
              <div><span style={{ color: "var(--text-muted)" }}>Gagal</span><br /><span className="mono">{detail.total_gagal || 0}</span></div>
            </div>
            {detail.error_message && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>Error Message</div>
                <pre style={{ fontSize: 11, background: "var(--bg)", padding: 12, borderRadius: "var(--radius-sm)", overflowX: "auto", maxHeight: 150, color: "#dc2626" }}>{detail.error_message}</pre>
              </div>
            )}
            {detail.failed_markets?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>Failed Markets</div>
                <ul style={{ margin: "4px 0 0", paddingLeft: 18, lineHeight: 1.6, fontSize: 12, color: "var(--text)" }}>
                  {detail.failed_markets.map((m, i) => {
                    let name, reason;
                    if (typeof m === "string") { name = m; reason = ""; }
                    else if (typeof m === "object" && m) {
                      name = m.nama_pasar || m.name || m.nama || JSON.stringify(m);
                      reason = m.alasan || m.reason || m.error || "";
                    } else { name = String(m); reason = ""; }
                    return (
                      <li key={i}>
                        {name}
                        {reason && <span style={{ color: "var(--text-light)", fontSize: 11 }}> ({reason})</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .log-table { width: 100%; border-collapse: collapse; }
        .log-table th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--text-muted); text-align: left; padding: 0 0 12px; border-bottom: 1px solid var(--border); white-space: nowrap; }
        .log-table td { padding: 12px 0; font-size: 13px; color: var(--text); border-bottom: 1px solid var(--bg-muted); vertical-align: middle; }
        .mono { font-family: var(--mono); font-weight: 600; }
        .st-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
        .st-badge.success { background: rgba(22,163,74,.1); color: #16a34a; }
        .st-badge.failed { background: rgba(220,38,38,.1); color: #dc2626; }
        .st-badge.running { background: rgba(245,158,11,.1); color: #d97706; }
        .st-dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; }
        .st-badge.success .st-dot { background: #16a34a; }
        .st-badge.failed .st-dot { background: #dc2626; }
        .st-badge.running .st-dot { background: #d97706; animation: geoPulse 1.5s infinite; }
        .dtl-btn { width: 28px; height: 28px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
        .dtl-btn:hover { border-color: var(--primary); color: var(--primary); }
        .flt-btn { padding: 6px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg); font-family: var(--font); font-size: 12px; font-weight: 500; color: var(--text-muted); cursor: pointer; text-transform: capitalize; }
        .flt-btn.active, .flt-btn:hover { background: var(--primary-10); color: var(--primary); border-color: var(--primary-20); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: var(--bg-white); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; max-width: 520px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,.15); max-height: 80vh; overflow-y: auto; }
      `}</style>
    </GeoAgriLayout>
  );
}
