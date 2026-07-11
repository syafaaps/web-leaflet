import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import GeoAgriLayout from "@components/GeoAgriLayout";
import AdminGuard from "@components/AdminGuard";
import StatCard from "@components/UI/StatCard";
import Panel from "@components/UI/Panel";
import Spinner from "@components/UI/Spinner";
import { apiGet, apiPost } from "@lib/api";

function fmtDuration(sec) {
  if (!sec && sec !== 0) return "—";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export default function MonitoringPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState("");

  const fetchStatus = useCallback(async () => {
    const res = await apiGet("/api/admin/pipeline/status");
    if (res?.status === "success") {
      setStatus(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleTrigger = async () => {
    setTriggering(true);
    setTriggerMsg("");
    const res = await apiPost("/api/admin/pipeline/trigger", {});
    if (res?.status === "success") {
      setTriggerMsg("Scraping workflow berhasil ditrigger!");
      setTimeout(fetchStatus, 2000);
    } else {
      setTriggerMsg(res?.message || "Gagal men-trigger scraping.");
    }
    setTriggering(false);
  };

  return (
    <AdminGuard>
      <GeoAgriLayout title="Monitoring Pipeline">
        <Head><title>Monitoring Pipeline — GeoAgri</title></Head>

        <div className="page-header">
          <h1 className="page-title">Monitoring Automated Data Pipeline</h1>
          <p className="page-desc">Pantau status pipeline scraping data harga komoditas secara real-time.</p>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={32} /></div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
              <StatCard label="Total Hari Ini" value={status?.total_hari_ini ?? "—"} />
              <StatCard label="Sukses" value={status?.total_success ?? "—"} color="#16a34a" />
              <StatCard label="Gagal" value={status?.total_failed ?? "—"} color="#dc2626" />
              <StatCard label="Berjalan" value={status?.total_running ?? "—"} color="#d97706" />
            </div>

            <div className="geo-card" style={{ padding: "22px 24px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Workflow Scraping</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    Terakhir dijalankan: {status?.last_scraping
                      ? new Date(status.last_scraping).toLocaleString("id-ID")
                      : "Belum pernah dijalankan"}
                  </div>
                </div>
                <button
                  onClick={handleTrigger}
                  disabled={triggering || status?.total_running > 0}
                  style={{
                    padding: "10px 20px", borderRadius: "var(--radius-sm)",
                    background: "var(--primary)", color: "#fff", border: "none",
                    fontSize: 13, fontWeight: 600, fontFamily: "var(--font)",
                    cursor: triggering ? "not-allowed" : "pointer",
                    opacity: triggering || status?.total_running > 0 ? 0.6 : 1,
                    transition: "opacity .15s",
                  }}
                >
                  {triggering ? "Menjalankan..." : status?.total_running > 0 ? "Sedang Berjalan" : "Jalankan Scraping"}
                </button>
              </div>
              {triggerMsg && (
                <div style={{
                  marginTop: 12, padding: "10px 14px", borderRadius: "var(--radius-sm)",
                  background: triggerMsg.includes("berhasil") ? "var(--green-10)" : "var(--red-10)",
                  border: `1px solid ${triggerMsg.includes("berhasil") ? "rgba(22,163,74,.2)" : "rgba(220,38,38,.2)"}`,
                  color: triggerMsg.includes("berhasil") ? "var(--green)" : "var(--red)",
                  fontSize: 12, fontWeight: 500,
                }}>
                  {triggerMsg}
                </div>
              )}
            </div>

            <Panel title="Log Aktivitas Terakhir" subtitle="10 aktivitas terbaru">
              <div style={{ overflowX: "auto" }}>
                <table className="geo-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Workflow</th>
                      <th>Provinsi</th>
                      <th>Status</th>
                      <th>Data</th>
                      <th>Durasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!status?.recent_logs?.length ? (
                      <tr><td colSpan="6" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Tidak ada log</td></tr>
                    ) : status.recent_logs.map((log) => (
                      <tr key={log.id}>
                        <td className="geo-mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>#{log.id}</td>
                        <td style={{ fontWeight: 600 }}>{log.workflow_name || "—"}</td>
                        <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{log.provinsi}</td>
                        <td>
                          <span className={`st-badge ${log.status}`}>
                            <span className="st-dot" />
                            {log.status === "success" ? "Sukses" : log.status === "failed" ? "Gagal" : "Berjalan"}
                          </span>
                        </td>
                        <td className="geo-mono">{log.total_data || 0}</td>
                        <td className="geo-mono">{fmtDuration(log.duration_seconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
      </GeoAgriLayout>
    </AdminGuard>
  );
}
