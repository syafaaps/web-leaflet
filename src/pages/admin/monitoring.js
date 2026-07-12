import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import GeoAgriLayout from "@components/GeoAgriLayout";
import AdminGuard from "@components/AdminGuard";
import StatCard from "@components/UI/StatCard";
import FilterBar from "@components/UI/FilterBar";
import Panel from "@components/UI/Panel";
import Spinner from "@components/UI/Spinner";
import { apiGet } from "@lib/api";

function fmtDuration(sec) {
  if (!sec && sec !== 0) return "—";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export default function MonitoringPage() {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  const [detail, setDetail] = useState(null);

  const fetchStatus = useCallback(async () => {
    const res = await apiGet("/api/admin/pipeline/status");
    if (res?.status === "success") setStatus(res.data);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let url = "/api/scraping/logs?per_page=100";
    if (filterStatus) url += `&status=${filterStatus}`;
    const res = await apiGet(url);
    if (res?.status === "success") {
      setLogs(res.data || []);
      if (!status) {
        setStatus({
          total_hari_ini: res.meta?.total_hari_ini,
          total_success: res.meta?.total_success,
          total_failed: res.meta?.total_failed,
          total_running: 0,
          last_scraping: res.meta?.last_scraping,
        });
      }
    }
    setLoading(false);
  }, [filterStatus, status]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <AdminGuard>
      <GeoAgriLayout title="Monitoring Pipeline">
        <Head><title>Monitoring Pipeline — GeoAgri</title></Head>

        <div className="page-header">
          <h1 className="page-title">Monitoring Automated Data Pipeline</h1>
          <p className="page-desc">Pantau status pipeline, jalankan scraping, dan telusuri riwayat aktivitas.</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
          <StatCard label="Total Hari Ini" value={status?.total_hari_ini ?? "—"} />
          <StatCard label="Sukses" value={status?.total_success ?? "—"} color="#16a34a" />
          <StatCard label="Gagal" value={status?.total_failed ?? "—"} color="#dc2626" />
          <StatCard label="Berjalan" value={status?.total_running ?? "—"} color="#d97706" />
        </div>

        {/* Filter */}
        <FilterBar>
          <div style={{ display: "flex", gap: 4 }}>
            {["", "success", "failed", "running"].map(f => (
              <button key={f} className={`flt-btn ${filterStatus === f ? "active" : ""}`} onClick={() => setFilterStatus(f)}>
                {f === "" ? "Semua" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </FilterBar>

        {/* Log Table */}
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
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Tidak ada log</td></tr>
                  ) : logs.map((item, i) => (
                    <tr key={item.id || i} onClick={() => setDetail(item)} style={{ cursor: "pointer" }}>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Detail Modal */}
        {detail && (
          <div className="modal-overlay" onClick={() => setDetail(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Detail Scraping #{detail.id}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{detail.workflow_name}</div>
                </div>
                <button onClick={() => setDetail(null)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "var(--bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
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
              </div>
              {detail.error_message && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>Error Message</div>
                  <pre style={{ fontSize: 11, background: "var(--bg)", padding: 12, borderRadius: "var(--radius-sm)", overflowX: "auto", maxHeight: 150, color: "#dc2626" }}>{detail.error_message}</pre>
                </div>
              )}
              {Array.isArray(detail.failed_markets) && detail.failed_markets.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>Failed Markets</div>
                  <ul style={{ margin: "4px 0 0", paddingLeft: 18, lineHeight: 1.6, fontSize: 12 }}>
                    {detail.failed_markets.map((m, i) => {
                      const name = typeof m === "string" ? m : m.nama_pasar || m.name || JSON.stringify(m);
                      return <li key={i}>{name}</li>;
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </GeoAgriLayout>
    </AdminGuard>
  );
}
