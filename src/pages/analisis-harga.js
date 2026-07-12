import { useEffect, useState, useCallback, useMemo } from "react";
import Head from "next/head";
// import dynamic from "next/dynamic";
import GeoAgriLayout from "@components/GeoAgriLayout";
import StatCard from "@components/UI/StatCard";
import GrafanaEmbed from "@components/UI/GrafanaEmbed";
import Select from "react-select";

// const Chart = dynamic(() => import("react-chartjs-2").then(m => m.Chart), { ssr: false });

const api = (url) => fetch(url).then(r => r.json());
const fmt = (n) => n != null ? "Rp " + Number(n).toLocaleString("id-ID") : "—";
// const fmtShort = (n) => n != null ? "Rp" + (n / 1000).toFixed(0) + "k" : "—";

// const colors = ["#155233", "#3aab74", "#16a34a", "#ea580c", "#7c3aed", "#0891b2", "#d97706", "#be185d", "#f43f5e", "#0ea5e9"];

// const chartDefaultOptions = {
//   responsive: true, maintainAspectRatio: false,
//   interaction: { mode: "index", intersect: false },
//   plugins: {
//     legend: { display: false },
//     tooltip: {
//       backgroundColor: "#fff", titleColor: "#111827", bodyColor: "#6b7280",
//       borderColor: "#e5e7eb", borderWidth: 1, padding: 10,
//       callbacks: { label: (ctx) => fmt(ctx.parsed.y) }
//     }
//   },
//   scales: {
//     x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#9ca3af", maxTicksLimit: 12 } },
//     y: { grid: { color: "rgba(0,0,0,.04)" }, border: { dash: [4, 4] }, ticks: { font: { size: 11 }, color: "#9ca3af", callback: v => fmtShort(v) } }
//   }
// };

export default function AnalisisHarga() {
  const [komoditasList, setKomoditasList] = useState([]);
  const [provinsiList, setProvinsiList] = useState([]);
  const [kabkotaOptions, setKabkotaOptions] = useState([]);
  const [pasarList, setPasarList] = useState([]);

  const [selectedKomoditas, setSelectedKomoditas] = useState(null);
  const [selectedProvinsi, setSelectedProvinsi] = useState(null);
  const [selectedKabkota, setSelectedKabkota] = useState(null);
  const [selectedPasar, setSelectedPasar] = useState(null);

  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");

  const [trendData, setTrendData] = useState(null);
  const [perProvData, setPerProvData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toDate = (d) => d.toISOString().slice(0, 10);

  useEffect(() => {
    const to = new Date();
    const from = new Date(Date.now() - 30 * 86400000);
    setTanggalMulai(toDate(from));
    setTanggalSelesai(toDate(to));
  }, []);

  useEffect(() => {
    Promise.all([
      api("/api/master/komoditas"),
      api("/api/master/provinsi"),
      api("/api/master/pasar"),
    ]).then(([kom, prov, ps]) => {
      setKomoditasList(kom.data || []);
      setProvinsiList(prov.data || []);
      setPasarList(ps.data || []);
    });
  }, []);

  useEffect(() => {
    setSelectedKabkota(null);
    setSelectedPasar(null);
    if (selectedProvinsi?.value) {
      api(`/api/master/kabkota?provinsi_id=${selectedProvinsi.value}`)
        .then(res => {
          const opts = (res.data ?? []).map(k => ({ value: String(k.id), label: k.nama }));
          setKabkotaOptions(opts);
        })
        .catch(() => setKabkotaOptions([]));
    } else {
      setKabkotaOptions([]);
    }
  }, [selectedProvinsi]);

  const pasarOptions = useMemo(() => {
    return pasarList
      .filter(p => !selectedKabkota?.value || String(p.kabupaten_id) === selectedKabkota.value)
      .map(p => ({ value: String(p.id), label: p.nama }));
  }, [pasarList, selectedKabkota]);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedKomoditas?.value) params.set("komoditas_id", selectedKomoditas.value);
    if (tanggalMulai) params.set("from", tanggalMulai);
    if (tanggalSelesai) params.set("to", tanggalSelesai);
    if (selectedProvinsi?.value) params.set("provinsi_id", selectedProvinsi.value);
    if (selectedKabkota?.value) params.set("kabkota_id", selectedKabkota.value);
    if (selectedPasar?.value) params.set("pasar_id", selectedPasar.value);
    return params;
  }, [selectedKomoditas, selectedProvinsi, selectedKabkota, selectedPasar, tanggalMulai, tanggalSelesai]);

  const applyAnalysis = useCallback(async () => {
    if (!selectedKomoditas?.value) return;
    setLoading(true);
    setError("");
    try {
      const params = buildParams();

      const [trendRes, perProvRes] = await Promise.all([
        api(`/api/komoditas/tren?${params}`),
        api(`/api/komoditas/per-provinsi?komoditas_id=${selectedKomoditas.value}`),
      ]);

      setTrendData(trendRes.data || []);
      setPerProvData(perProvRes);
    } catch (e) {
      console.error(e);
      setError("Gagal memuat data");
    }
    setLoading(false);
  }, [selectedKomoditas, buildParams]);

  const resetFilters = () => {
    setSelectedKomoditas(null);
    setSelectedProvinsi(null);
    setSelectedKabkota(null);
    setSelectedPasar(null);
    const to = new Date();
    const from = new Date(Date.now() - 30 * 86400000);
    setTanggalMulai(toDate(from));
    setTanggalSelesai(toDate(to));
    setTrendData(null);
    setPerProvData(null);
    setError("");
  };

  const stats = useMemo(() => {
    if (!trendData?.length) return null;
    const prices = trendData.map(d => Number(d.harga)).filter(v => v > 0);
    if (!prices.length) return null;
    const sorted = [...prices].sort((a, b) => a - b);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const selisih = max - min;
    return { rata: avg, min, max, selisih, count: prices.length };
  }, [trendData]);

  const ranking = useMemo(() => {
    if (!perProvData?.data?.length) return [];
    return [...perProvData.data].sort((a, b) => b.harga - a.harga);
  }, [perProvData]);

  // const chartData = useMemo(() => {
  //   if (!trendData?.length) return null;
  //   return {
  //     labels: trendData.map(d => {
  //       const dt = new Date(d.tanggal + "T00:00:00");
  //       return dt.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  //     }),
  //     datasets: [{
  //       label: selectedKomoditas?.label || "Harga",
  //       data: trendData.map(d => Number(d.harga)),
  //       borderColor: "#155233",
  //       backgroundColor: (ctx) => {
  //         if (!ctx.chart?.ctx) return "rgba(21,82,51,0.08)";
  //         const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 280);
  //         g.addColorStop(0, "rgba(21,82,51,0.15)");
  //         g.addColorStop(1, "rgba(21,82,51,0)");
  //         return g;
  //       },
  //       fill: true, borderWidth: 2.5, pointRadius: 2, pointHoverRadius: 6, tension: .4,
  //     }]
  //   };
  // }, [trendData, selectedKomoditas]);

  // const comparisonChartData = useMemo(() => {
  //   if (!ranking.length) return null;
  //   const top = ranking.slice(0, 15);
  //   const avg = ranking.reduce((s, r) => s + r.harga, 0) / ranking.length;
  //   return {
  //     labels: top.map(d => d.provinsi),
  //     datasets: [
  //       {
  //         data: top.map(d => d.harga),
  //         backgroundColor: top.map(d =>
  //           d.harga > avg * 1.1 ? "#fca5a5" : d.harga < avg * 0.9 ? "#86efac" : "#a5b4fc"
  //         ),
  //         borderColor: top.map(d =>
  //           d.harga > avg * 1.1 ? "#dc2626" : d.harga < avg * 0.9 ? "#16a34a" : "#2d3bde"
  //         ),
  //         borderWidth: 1.5,
  //         borderRadius: 5,
  //       },
  //     ],
  //   };
  // }, [ranking]);

  // const barOptions = {
  //   ...chartDefaultOptions,
  //   indexAxis: "y",
  //   scales: {
  //     x: { grid: { display: false }, ticks: { font: { size: 10 }, callback: v => fmtShort(v) } },
  //     y: { grid: { display: false }, ticks: { font: { size: 11 } } }
  //   }
  // };

  const komoditasOpts = komoditasList.map(k => ({ value: String(k.id), label: k.nama }));
  const provinsiOpts = provinsiList.map(p => ({ value: String(p.id), label: p.nama }));

  const selectStyles = {
    control: (base) => ({ ...base, minHeight: 36, fontSize: 13 }),
    menu: (base) => ({ ...base, zIndex: 999 }),
    option: (base) => ({ ...base, fontSize: 13 }),
  };

  const pp = perProvData?.statistik;
  const insight = ranking.length >= 2 && pp ? (() => {
    const highest = ranking[0];
    const lowest = ranking[ranking.length - 1];
    const selisih = pp.max - pp.min;
    return (
      <>
        Harga tertinggi di <strong>{highest.provinsi}</strong> ({fmt(highest.harga)}), terendah di <strong>{lowest.provinsi}</strong> ({fmt(lowest.harga)}). Selisih harga <strong>{fmt(selisih)}</strong>.
      </>
    );
  })() : null;

  return (
    <GeoAgriLayout title="Analisis Harga">
      <Head><title>Analisis Harga — GeoAgri</title></Head>

      <div className="page-header">
        <h1 className="page-title">Analisis Harga Komoditas</h1>
        <p className="page-desc">Analisis tren harga, ringkasan statistik, dan perbandingan wilayah secara interaktif.</p>
      </div>

      <div className="filter-bar" style={{ flexWrap: "wrap", gap: 10, padding: "16px 20px", marginBottom: 20 }}>
        <span className="filter-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filter:
        </span>

        <div style={{ minWidth: 180, flex: "1 1 160px" }}>
          <Select options={komoditasOpts} value={selectedKomoditas} onChange={setSelectedKomoditas}
            placeholder="Cari Komoditas..." isClearable
            className="react-select" classNamePrefix="rs" styles={selectStyles} />
        </div>
        <div style={{ minWidth: 160, flex: "1 1 140px" }}>
          <Select options={provinsiOpts} value={selectedProvinsi} onChange={setSelectedProvinsi}
            placeholder="Pilih Provinsi..." isClearable
            className="react-select" classNamePrefix="rs" styles={selectStyles} />
        </div>
        <div style={{ minWidth: 160, flex: "1 1 140px" }}>
          <Select options={kabkotaOptions} value={selectedKabkota} onChange={setSelectedKabkota}
            placeholder="Pilih Kab/Kota..." isDisabled={!kabkotaOptions.length} isClearable
            className="react-select" classNamePrefix="rs" styles={selectStyles} />
        </div>
        <div style={{ minWidth: 160, flex: "1 1 140px" }}>
          <Select options={pasarOptions} value={selectedPasar} onChange={setSelectedPasar}
            placeholder="Pilih Pasar..." isDisabled={!pasarOptions.length} isClearable
            className="react-select" classNamePrefix="rs" styles={selectStyles} />
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="date" value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)}
            className="filter-date-input" style={{ fontSize: 12, width: 140 }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>s.d.</span>
          <input type="date" value={tanggalSelesai} onChange={e => setTanggalSelesai(e.target.value)}
            className="filter-date-input" style={{ fontSize: 12, width: 140 }} />
        </div>

        <button onClick={applyAnalysis} disabled={!selectedKomoditas}
          className="geo-btn-primary" style={{ whiteSpace: "nowrap" }}>
          {loading ? "Memuat..." : "Terapkan Analisis"}
        </button>
        <button onClick={resetFilters} className="filter-btn" style={{ whiteSpace: "nowrap" }}>
          Reset
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 18px", borderRadius: "var(--radius-sm)", background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.2)", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {insight && (
        <div style={{ marginBottom: 16, padding: "14px 18px", borderRadius: "var(--radius-sm)", background: "linear-gradient(135deg, #eff6ff, #f0fdf4)", border: "1px solid #bfdbfe", fontSize: 13, color: "#1e40af", lineHeight: 1.6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{insight}</span>
          </div>
        </div>
      )}

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
          <StatCard label="Rata-rata Harga" value={fmt(stats.rata)} sub="Seluruh periode" />
          <StatCard label="Harga Tertinggi" value={fmt(stats.max)} color="#dc2626" sub={stats.count + " data"} />
          <StatCard label="Harga Terendah" value={fmt(stats.min)} color="#16a34a" sub={stats.count + " data"} />
          <StatCard label="Selisih Harga" value={fmt(stats.selisih)} color="#7c3aed" sub="max − min" />
          <StatCard label="Jumlah Data" value={stats.count} color="#ea580c" sub="total record" />
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
            <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* ── CHART.JS: TREN HARGA (DINONAKTIFKAN) ── */}
      {/* {!loading && chartData && (
        <div className="geo-card" style={{ padding: "22px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Grafik Tren Harga</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {selectedKomoditas?.label} · {tanggalMulai} s.d. {tanggalSelesai}
                {selectedProvinsi && <span> · {selectedProvinsi.label}</span>}
                {selectedKabkota && <span> · {selectedKabkota.label}</span>}
                {selectedPasar && <span> · {selectedPasar.label}</span>}
              </div>
            </div>
          </div>
          <div style={{ height: 320, position: "relative" }}>
            <Chart type="line" data={chartData} options={chartDefaultOptions} />
          </div>
        </div>
      )} */}

      {!loading && !trendData && !error && selectedKomoditas && (
        <div className="geo-card" style={{ padding: "22px 24px", marginBottom: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          Tidak ada data untuk rentang tanggal yang dipilih.
        </div>
      )}

      {/* ── CHART.JS: PERBANDINGAN PROVINSI (DINONAKTIFKAN) ── */}
      {/* {!loading && comparisonChartData && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div className="geo-card" style={{ padding: "22px 24px" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                Perbandingan Harga per Provinsi
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {selectedProvinsi ? selectedProvinsi.label : "Semua Provinsi"}
                {selectedKabkota && <span> · {selectedKabkota.label}</span>}
              </div>
            </div>
            <div style={{ height: Math.max(200, ranking.length * 28), position: "relative" }}>
              <Chart type="bar" data={comparisonChartData} options={barOptions} />
            </div>
          </div>

          <div className="geo-card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Ranking Provinsi</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", color: "var(--text-muted)" }}>#</span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", color: "var(--text-muted)", flex: 1, marginLeft: 8 }}>Provinsi</span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", color: "var(--text-muted)", textAlign: "right" }}>Harga</span>
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {ranking.slice(0, 10).map((row, i) => {
                const avg = stats?.rata || 1;
                const dev = ((row.harga - avg) / avg) * 100;
                return (
                  <div key={row.provinsi_id || i}
                    style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--bg-muted)" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: i < 3 ? "var(--primary)" : "var(--text-muted)", width: 24, textAlign: "center" }}>{i + 1}</span>
                    <span style={{ flex: 1, marginLeft: 8, fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{row.provinsi}</span>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{fmt(row.harga)}</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: dev > 5 ? "#dc2626" : dev < -5 ? "#16a34a" : "var(--text-muted)" }}>
                        {dev > 0 ? "+" : ""}{dev.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )} */}

      {!loading && trendData && (
        <div className="geo-card" style={{ padding: "22px 24px", marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>
            Tren Harga (Grafana)
          </div>
          <GrafanaEmbed
            panelId="panel-2"
            komoditasIds={selectedKomoditas ? [selectedKomoditas.value] : []}
            provinsiIds={selectedProvinsi ? [selectedProvinsi.value] : []}
            kabkotaIds={selectedKabkota ? [selectedKabkota.value] : []}
            pasarIds={selectedPasar ? [selectedPasar.value] : []}
            from={tanggalMulai}
            to={tanggalSelesai}
            tab="analisis-tren-harga-komoditas"
          />
        </div>
      )}

      {!loading && !selectedKomoditas && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: .3, marginBottom: 12 }}>
            <path d="M22 12l-4 0-3 9-6-18-3 9-4 0" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Pilih komoditas dan klik "Terapkan Analisis" untuk memulai</div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </GeoAgriLayout>
  );
}
