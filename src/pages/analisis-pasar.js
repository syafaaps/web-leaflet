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

      <div className="page-header">
        <h1 className="page-title">Analisis Pasar</h1>
        <p className="page-desc">Kualitas dan statistik data harga per pasar komoditas.</p>
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
                const badgeClass = pct > 15 ? "geo-badge-red" : pct > 8 ? "geo-badge-orange" : pct > 5 ? "geo-badge-green" : "";
                return (
                  <tr key={i}>
                    <td><strong>{item.nama}</strong></td>
                    <td style={{ color: "var(--text-muted)" }}>{item.provinsi || "—"}</td>
                    <td className="geo-mono">{item.total_records?.toLocaleString() || "—"}</td>
                    <td className="geo-mono">{item.null_records?.toLocaleString() || "—"}</td>
                    <td><span className={`geo-badge ${badgeClass}`}>{pct}%</span></td>
                    <td className="geo-mono">{item.avg_harga ? "Rp " + Number(item.avg_harga).toLocaleString() : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data.length > perPage && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16, alignItems: "center" }}>
            <button className="geo-page-btn" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>{"\u2039"}</button>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Halaman {page} dari {Math.ceil(data.length / perPage)}</span>
            <button className="geo-page-btn" disabled={page >= Math.ceil(data.length / perPage)} onClick={() => setPage(p => p + 1)}>{"\u203A"}</button>
          </div>
        )}
      </Panel>


    </GeoAgriLayout>
  );
}
