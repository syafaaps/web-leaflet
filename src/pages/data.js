import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import GeoAgriLayout from "@components/GeoAgriLayout";
import Badge from "@components/UI/Badge";
import Select from "react-select";

const api = (url) => fetch(url).then(r => r.json());

const emojiMap = {
  "cabai": "\uD83C\uDF36\uFE0F", "cabai rawit": "\uD83C\uDF36\uFE0F", "cabai merah": "\uD83C\uDF36\uFE0F",
  "bawang": "\uD83E\uDDC5", "bawang merah": "\uD83E\uDDC5", "bawang putih": "\uD83E\uDDC4",
  "beras": "\uD83C\uDF3E", "daging": "\uD83E\uDD69", "daging sapi": "\uD83D\uDC2E",
  "daging ayam": "\uD83D\uDC14", "ayam": "\uD83D\uDC14", "telur": "\uD83E\uDD5A",
  "ikan": "\uD83D\uDC1F", "kentang": "\uD83E\uDD54", "wortel": "\uD83E\uDD55",
  "tomat": "\uD83C\uDF45", "cabe": "\uD83C\uDF36\uFE0F", "cabe rawit": "\uD83C\uDF36\uFE0F",
  "cabe merah": "\uD83C\uDF36\uFE0F", "jagung": "\uD83C\uDF3D", "kedelai": "\uD83E\uDEDA",
  "kacang": "\uD83E\uDD5C", "pisang": "\uD83C\uDF4C", "mangga": "\uD83E\uDD6D",
  "jeruk": "\uD83C\uDF4A", "apel": "\uD83C\uDF4E", "alpukat": "\uD83E\uDD51",
  "kelapa": "\uD83E\uDD65", "gula": "\uD83C\uDF6C", "tepung": "\uD83C\uDF5C",
  "minyak": "\uD83E\uDED7", "susu": "\uD83E\uDD5B", "kopi": "\u2615",
  "teh": "\uD83C\uDF75", "garam": "\uD83E\uDDC2",
};

function getEmoji(name) {
  if (!name) return "\uD83D\uDCC6";
  const n = name.toLowerCase();
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (n.includes(key)) return emoji;
  }
  return "\uD83D\uDCC6";
}

function statusColor(s) {
  switch ((s || "").toLowerCase()) {
    case "valid": return "green";
    case "null": return "red";
    default: return "gray";
  }
}

export default function DataPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("terbaru");
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [komoditas, setKomoditas] = useState([]);
  const [provinsiList, setProvinsiList] = useState([]);
  const [filterKom, setFilterKom] = useState("");
  const [filterProv, setFilterProv] = useState("");
  const [filterKabKota, setFilterKabKota] = useState("");
  const [kabkotaOptions, setKabkotaOptions] = useState([]);
  const [filterFrom, setFilterFrom] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [filterTo, setFilterTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [lastSync, setLastSync] = useState(null);
  const perPage = 25;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/komoditas/data?from=${filterFrom}&to=${filterTo}&limit=500`;
      if (filterKom) url += `&komoditas_id=${filterKom}`;
      if (filterProv) url += `&provinsi_id=${filterProv}`;
      if (filterKabKota) url += `&kabkota_id=${filterKabKota}`;
      const res = await api(url);
      setData(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filterFrom, filterTo, filterKom, filterProv, filterKabKota]);

  useEffect(() => {
    const [kRes, pRes] = Promise.all([
      api("/api/master/komoditas"),
      api("/api/master/provinsi"),
    ]).then(([k, p]) => {
      setKomoditas(k.data || []);
      setProvinsiList(p.data || []);
    });
    fetchData();
    setLastSync(new Date().toLocaleString("id-ID"));
  }, []);

  useEffect(() => {
    if (!filterProv) { setKabkotaOptions([]); setFilterKabKota(""); return; }
    api(`/api/master/kabkota?provinsi_id=${filterProv}`).then(res => {
      setKabkotaOptions(res.data || []);
      setFilterKabKota("");
    });
  }, [filterProv]);

  const filtered = data.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (item.komoditas || "").toLowerCase().includes(q)
      || (item.pasar || "").toLowerCase().includes(q)
      || (item.provinsi || "").toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortOption) {
      case "terlama": return new Date(a.tanggal) - new Date(b.tanggal);
      case "harga_tertinggi": return (b.harga || 0) - (a.harga || 0);
      case "harga_terendah": return (a.harga || 0) - (b.harga || 0);
      default: return new Date(b.tanggal) - new Date(a.tanggal);
    }
  });

  const totalPages = Math.ceil(sorted.length / perPage);
  const paged = sorted.slice((page - 1) * perPage, page * perPage);

  const exportCSV = () => {
    const header = "Tanggal,Provinsi,Kab/Kota,Pasar,Komoditas,Harga,Satuan,Status";
    const rows = sorted.map(item =>
      `"${item.tanggal}","${item.provinsi}","${item.kabupaten || ""}","${item.pasar}","${item.komoditas}",${item.harga ?? ""},"${item.satuan || ""}","${item.status}"`
    );
    const blob = new Blob(["\ufeff" + header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `geoagri-data-${filterTo}.csv`;
    a.click();
  };

  const exportExcel = () => {
    const header = ["Tanggal", "Provinsi", "Kab/Kota", "Pasar", "Komoditas", "Harga", "Satuan", "Status"];
    const rows = sorted.map(item => [item.tanggal, item.provinsi, item.kabupaten || "", item.pasar, item.komoditas, item.harga ?? "", item.satuan || "", item.status]);
    const xlsContent = [header, ...rows].map(r => r.join("\t")).join("\n");
    const blob = new Blob(["\ufeff" + xlsContent], { type: "application/vnd.ms-excel;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `geoagri-data-${filterTo}.xls`;
    a.click();
  };

  return (
    <GeoAgriLayout title="Data">
      <Head><title>Data Komoditas — GeoAgri</title></Head>

      <div className="page-header">
        <h1 className="page-title">Data Komoditas</h1>
        <p className="page-desc">Dataset harga komoditas hasil scraping dari seluruh pasar.</p>
      </div>

      <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 340 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Cari komoditas, pasar, provinsi..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)", fontSize: 13, fontWeight: 500, outline: "none" }} />
        </div>
        <select value={sortOption} onChange={e => setSortOption(e.target.value)}
          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", padding: "7px 12px", borderRadius: "var(--radius-sm)", fontFamily: "var(--font)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          <option value="terbaru">Terbaru</option>
          <option value="terlama">Terlama</option>
          <option value="harga_tertinggi">Harga Tertinggi</option>
          <option value="harga_terendah">Harga Terendah</option>
        </select>
        <button onClick={() => setShowFilter(!showFilter)}
          style={{ padding: "7px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: showFilter ? "var(--primary-10)" : "var(--bg-white)", color: showFilter ? "var(--primary)" : "var(--text-muted)", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font)" }}>
          Filter {showFilter ? "\u25B2" : "\u25BC"}
        </button>
        <button onClick={exportCSV}
          style={{ padding: "7px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg-white)", color: "var(--text)", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font)" }}>
          Export CSV
        </button>
        <button onClick={exportExcel}
          style={{ padding: "7px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg-white)", color: "var(--text)", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font)" }}>
          Export Excel
        </button>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--mono)", fontWeight: 500, marginLeft: "auto" }}>
          {filtered.length} hasil
        </div>
      </div>

      {showFilter && (
        <div style={{ marginBottom: 16, padding: "14px 18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Komoditas</div>
            <select value={filterKom} onChange={e => { setFilterKom(e.target.value); setPage(1); }}
              style={{ background: "var(--bg-white)", border: "1px solid var(--border)", color: "var(--text)", padding: "6px 12px", borderRadius: "var(--radius-sm)", fontFamily: "var(--font)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              <option value="">Semua</option>
              {komoditas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Provinsi</div>
            <Select
              name="provinsi"
              options={provinsiList.map(p => ({ value: String(p.id), label: p.nama }))}
              value={filterProv ? { value: filterProv, label: provinsiList.find(p => String(p.id) === filterProv)?.nama } : null}
              onChange={val => { setFilterProv(val ? val.value : ""); setPage(1); }}
              placeholder="Semua"
              isClearable
              className="react-select"
              classNamePrefix="rs"
              styles={{ control: (base) => ({ ...base, minHeight: 36, fontSize: 13, minWidth: 180 }), menu: (base) => ({ ...base, zIndex: 999 }) }}
            />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Kab/Kota</div>
            <Select
              name="kabkota"
              options={kabkotaOptions.map(k => ({ value: String(k.id), label: k.nama }))}
              value={filterKabKota ? { value: filterKabKota, label: kabkotaOptions.find(k => String(k.id) === filterKabKota)?.nama } : null}
              onChange={val => { setFilterKabKota(val ? val.value : ""); setPage(1); }}
              placeholder="Semua"
              isClearable
              isDisabled={!filterProv}
              className="react-select"
              classNamePrefix="rs"
              styles={{ control: (base) => ({ ...base, minHeight: 36, fontSize: 13, minWidth: 180 }), menu: (base) => ({ ...base, zIndex: 999 }) }}
            />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Dari</div>
            <input type="date" value={filterFrom} onChange={e => { setFilterFrom(e.target.value); setPage(1); }}
              style={{ background: "var(--bg-white)", border: "1px solid var(--border)", color: "var(--text)", padding: "6px 12px", borderRadius: "var(--radius-sm)", fontFamily: "var(--font)", fontSize: 12, cursor: "pointer" }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Sampai</div>
            <input type="date" value={filterTo} onChange={e => { setFilterTo(e.target.value); setPage(1); }}
              style={{ background: "var(--bg-white)", border: "1px solid var(--border)", color: "var(--text)", padding: "6px 12px", borderRadius: "var(--radius-sm)", fontFamily: "var(--font)", fontSize: 12, cursor: "pointer" }} />
          </div>
          <button onClick={() => { fetchData(); setPage(1); }}
            style={{ padding: "6px 16px", border: "1px solid var(--primary-20)", borderRadius: "var(--radius-sm)", background: "var(--primary-10)", color: "var(--primary)", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font)" }}>
            Terapkan
          </button>
        </div>
      )}

      <div className="geo-card" style={{ padding: "22px 24px" }}>
        {lastSync && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: 11, color: "var(--text-muted)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#16a34a"><circle cx="12" cy="12" r="6" /></svg>
            SYSTEM LIVE: SINKRONISASI TERAKHIR — {lastSync}
          </div>
        )}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, color: "var(--text-muted)", fontSize: 13 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite", marginRight: 8 }}>
              <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
            </svg>
            Memuat data...
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 24 }}></th>
                    <th>Tanggal</th>
                    <th>Provinsi</th>
                    <th>Kab/Kota</th>
                    <th>Pasar</th>
                    <th>Komoditas</th>
                    <th style={{ textAlign: "right" }}>Harga</th>
                    <th>Satuan</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr><td colSpan="9" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Tidak ada data</td></tr>
                  ) : paged.map((item, i) => (
                    <tr key={item.id || i}>
                      <td style={{ fontSize: 16 }}>{getEmoji(item.komoditas)}</td>
                      <td className="mono">{item.tanggal || "—"}</td>
                      <td style={{ color: "var(--text-muted)" }}>{item.provinsi}</td>
                      <td style={{ color: "var(--text-muted)" }}>{item.kabupaten || "—"}</td>
                      <td>{item.pasar}</td>
                      <td><strong>{item.komoditas}</strong></td>
                      <td className="mono" style={{ textAlign: "right" }}>{item.harga ? "Rp " + Number(item.harga).toLocaleString("id-ID") : "—"}</td>
                      <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.satuan || "—"}</td>
                      <td><Badge type={statusColor(item.status)} label={item.status || "—"} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16, alignItems: "center" }}>
                <button className="dt-btn" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹ Prev</button>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{page} / {totalPages}</span>
                <button className="dt-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next ›</button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--text-muted); text-align: left; padding: 0 8px 12px; border-bottom: 1px solid var(--border); white-space: nowrap; user-select: none; }
        .data-table td { padding: 8px; font-size: 13px; color: var(--text); border-bottom: 1px solid var(--bg-muted); vertical-align: middle; }
        .mono { font-family: var(--mono); font-weight: 600; font-size: 12px; }
        .dt-btn { padding: 6px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg-white); font-family: var(--font); font-size: 12px; font-weight: 500; color: var(--text-muted); cursor: pointer; }
        .dt-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
        .dt-btn:disabled { opacity: .35; cursor: default; }
      `}</style>
    </GeoAgriLayout>
  );
}
