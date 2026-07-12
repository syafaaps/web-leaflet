import { useEffect, useState } from "react";
import Head from "next/head";
import GeoAgriLayout from "@components/GeoAgriLayout";
import AdminGuard from "@components/AdminGuard";

const api = (url) => fetch(url).then(r => r.json());

export default function MasterPage({ title, endpoint, columns, formFields }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(endpoint).then(res => {
      setItems(res.data || []);
      setLoading(false);
    });
  }, [endpoint]);

  return (
    <AdminGuard>
    <GeoAgriLayout title={title}>
      <Head><title>{title} — GeoAgri</title></Head>

      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-desc">Master data {title.toLowerCase()}.</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: "var(--text-muted)", fontSize: 13 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite", marginRight: 8 }}>
            <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
          </svg>
          Memuat data...
        </div>
      ) : (
        <div className="geo-card" style={{ padding: "22px 24px" }}>
          <table className="master-table">
            <thead>
              <tr>
                <th>#</th>
                {columns.map(col => <th key={col.key}>{col.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={columns.length + 1} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Tidak ada data.</td></tr>
              ) : items.map((item, i) => (
                <tr key={item.id || i}>
                  <td className="mono" style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                  {columns.map(col => <td key={col.key}>{col.render ? col.render(item) : item[col.key] ?? "—"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .master-table { width: 100%; border-collapse: collapse; }
        .master-table th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--text-muted); text-align: left; padding: 0 8px 12px; border-bottom: 1px solid var(--border); white-space: nowrap; }
        .master-table td { padding: 10px 8px; font-size: 13px; color: var(--text); border-bottom: 1px solid var(--bg-muted); vertical-align: middle; }
        .mono { font-family: var(--mono); font-weight: 600; font-size: 12px; }
      `}</style>
    </GeoAgriLayout>
    </AdminGuard>
  );
}
