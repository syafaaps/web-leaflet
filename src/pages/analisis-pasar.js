import { useEffect, useState, useRef, useCallback } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import GeoAgriLayout from "@components/GeoAgriLayout";
import FilterBar from "@components/UI/FilterBar";
import Panel from "@components/UI/Panel";

const PasarMap = dynamic(() => import("../components/charts/PasarMap"), { ssr: false });

const api = (url) => fetch(url).then(r => r.json());

export default function AnalisisPasar() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState([]);
  const perPage = 10;

  const fetchData = useCallback(async () => {
    try {
      const res = await api("/api/master/pasar?limit=100");
      setData(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const start = (page - 1) * perPage;
    setPageData(data.slice(start, start + perPage));
  }, [data, page]);

  return (
    <GeoAgriLayout title="Analisis Pasar">
      <Head><title>Analisis Pasar ï¿½ GeoAgri</title></Head>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.6px", color: "var(--text)" }}>Analisis Pasar</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>Kualitas dan statistik data harga per pasar komoditas.</p>
      </div>

      <div className="geo-card" style={{ padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
          Sebaran Pasar
        </div>
        <div id="analisisPasarMap" style={{ height: 360, borderRadius: "var(--radius-sm)", zIndex: 0 }} />
        <PasarMap pasars={data} mapId="analisisPasarMap" />
      </div>

      <Panel title="Rekap Data per Pasar">
        <div style={{ overflowX: "auto" }}>
          <table className="geo-table">
            <thead>
              <tr>
                <th>Pasar</th>
                <th>Provinsi</th>
                <th>Total Record</th>
                <th>NULL</th>
                <th>% NULL</th>
                <th>Rata Harga</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Tidak ada data</td></tr>
              ) : pageData.map((item, i) => {
                const pct = item.null_pct || 0;
                const badgeClass = pct > 15 ? "null-high" : pct > 8 ? "null-medium" : pct > 5 ? "null-low" : "";
                return (
                  <tr key={i}>
                    <td><strong>{item.nama}</strong></td>
                    <td style={{ color: "var(--text-muted)" }}>{item.provinsi || "ï¿½"}</td>
                    <td className="geo-mono">{item.total_records?.toLocaleString() || "ï¿½"}</td>
                    <td className="geo-mono">{item.null_records?.toLocaleString() || "ï¿½"}</td>
                    <td><span className={`null-badge ${badgeClass}`}>{pct}%</span></td>
                    <td className="geo-mono">{item.avg_harga ? "Rp " + Number(item.avg_harga).toLocaleString() : "ï¿½"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data.length > perPage && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16, alignItems: "center" }}>
            <button className="geo-page-btn" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>ï¿½</button>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Halaman {page} dari {Math.ceil(data.length / perPage)}</span>
            <button className="geo-page-btn" disabled={page >= Math.ceil(data.length / perPage)} onClick={() => setPage(p => p + 1)}>ï¿½</button>
          </div>
        )}
      </Panel>

      <style jsx global>{`
        .geo-table { width: 100%; border-collapse: collapse; }
        .geo-table th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--text-muted); text-align: left; padding: 0 0 12px; border-bottom: 1px solid var(--border); white-space: nowrap; }
        .geo-table td { padding: 12px 0; font-size: 13px; color: var(--text); border-bottom: 1px solid var(--bg-muted); vertical-align: middle; }
        .geo-mono { font-family: var(--mono); font-weight: 600; }
        .null-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; font-family: var(--mono); padding: 2px 8px; border-radius: 20px; }
        .null-badge.null-high { background: rgba(220,38,38,.1); color: #dc2626; }
        .null-badge.null-medium { background: rgba(234,88,12,.1); color: #ea580c; }
        .null-badge.null-low { background: rgba(22,163,74,.1); color: #16a34a; }
        .geo-page-btn { width: 32px; height: 32px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg-white); font-family: var(--mono); font-size: 12px; font-weight: 600; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .geo-page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
        .geo-page-btn:disabled { opacity: .35; cursor: default; }
      `}</style>
    </GeoAgriLayout>
  );
}
