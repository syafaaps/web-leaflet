import { useEffect, useState, useCallback, useMemo } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import GeoAgriLayout from "@components/GeoAgriLayout";
import Select from "react-select";

const LeafletHeatmapMap = dynamic(() => import("@components/Map/LeafletHeatmapMap"), { ssr: false });
const LeafletMapDynamic = dynamic(() => import("@components/Map/LeafletDynamicMap"), { ssr: false });

const api = (url) => fetch(url, { cache: 'no-cache' }).then(r => r.json());
const fmt = (n) => n != null ? "Rp " + Number(n).toLocaleString("id-ID") : "—";

export default function PetaPasar() {
  const [layer, setLayer] = useState("choropleth");
  const [level, setLevel] = useState("provinsi");
  const [pasars, setPasars] = useState([]);
  const [geoData, setGeoData] = useState(null);
  const [komoditas, setKomoditas] = useState([]);
  const [provinsiList, setProvinsiList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [provinsiIds, setProvinsiIds] = useState([]);
  const [tanggal, setTanggal] = useState(() => new Date(Date.now() - 86400000).toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [kabkotaOptions, setKabkotaOptions] = useState([]);
  const [kabkotaOption, setKabkotaOption] = useState(null);

  const fetchMaster = useCallback(async () => {
    const [kRes, pRes] = await Promise.all([
      api("/api/master/komoditas"),
      api("/api/master/provinsi"),
    ]);
    const items = kRes.data || [];
    setKomoditas(items);
    setProvinsiList(pRes.data || []);
    if (items.length) setSelectedId(String(items[0].id));
  }, []);

  const fetchKabkota = useCallback(async (ids) => {
    const provId = ids?.[0];
    if (!provId) { setKabkotaOptions([]); setKabkotaOption(null); return; }
    const res = await api(`/api/master/kabkota?provinsi_id=${provId}`);
    setKabkotaOptions((res.data ?? []).map(k => ({ value: String(k.id), label: k.nama })));
    setKabkotaOption(null);
  }, []);

  useEffect(() => { fetchKabkota(provinsiIds); }, [provinsiIds, fetchKabkota]);

  useEffect(() => {
    if (kabkotaOption?.value) {
      setLevel("kabupaten");
    } else {
      setLevel("provinsi");
    }
  }, [kabkotaOption]);

  const fetchData = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const provinsiParam = provinsiIds.length
        ? '&' + provinsiIds.map(id => `provinsi_ids[]=${id}`).join('&')
        : '';

      if (layer === "choropleth") {
        const kId = kabkotaOption?.value;
        const effectiveLevel = kId ? "kabupaten" : level;
        const res = await api(`/api/komoditas/map?komoditas_id=${selectedId}&tanggal=${tanggal}&level=${effectiveLevel}${provinsiParam}${kId ? `&kabkota_id=${kId}` : ""}`);
        setGeoData(res);
        setPasars([]);
      } else if (layer === "markers") {
        const kId = kabkotaOption?.value;
        const res = await api(`/api/komoditas/pasar-map?komoditas_id=${selectedId}&tanggal=${tanggal}${provinsiParam}${kId ? `&kabkota_id=${kId}` : ""}`);
        const features = (res.features || []).map(f => ({
          ...f.properties,
          latitude: f.geometry?.coordinates?.[1],
          longitude: f.geometry?.coordinates?.[0],
        }));
        setPasars(features);
        setGeoData(null);
      }
      const pp = await api(`/api/komoditas/per-provinsi?komoditas_id=${selectedId}&tanggal=${tanggal}${provinsiParam}`);
      if (pp.status === "success") setStats(pp);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [selectedId, layer, level, tanggal, provinsiIds, kabkotaOption]);

  useEffect(() => { fetchMaster(); }, [fetchMaster]);
  useEffect(() => { if (selectedId) fetchData(); }, [selectedId]);

  const komoditasTerpilih = useMemo(
    () => komoditas.find(k => String(k.id) === selectedId),
    [komoditas, selectedId]
  );

  const choroplethReady = useMemo(() => {
    if (!geoData?.features) return null;
    const nama = komoditasTerpilih?.nama || "";
    return {
      ...geoData,
      features: geoData.features.map(f => ({
        ...f,
        properties: {
          ...f.properties,
          kabupaten: f.properties.nama || f.properties.kabupaten,
          rata_kabupaten: f.properties.harga || f.properties.rata_kabupaten,
          komoditas_nama: nama,
        }
      }))
    };
  }, [geoData, komoditasTerpilih]);

  const markerReady = useMemo(() => {
    const prices = pasars.map(p => Number(p.harga)).filter(v => v > 0);
    const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    return pasars.map(p => {
      const harga = Number(p.harga) || 0;
      let kategori = 'Rata-rata';
      if (harga > 0) {
        if (harga > avg * 1.05) kategori = 'Di Atas Rata-rata';
        else if (harga < avg * 0.95) kategori = 'Di Bawah Rata-rata';
      }
      return { ...p, nama_pasar: p.nama || p.nama_pasar || "", harga, kategori };
    });
  }, [pasars]);

  const hargaMinMax = useMemo(() => {
    if (geoData?.features?.length) {
      const prices = geoData.features.map(f => Number(f.properties?.harga)).filter(v => !isNaN(v) && v > 0);
      if (prices.length) return { min: Math.min(...prices), max: Math.max(...prices) };
    }
    if (pasars.length) {
      const prices = pasars.map(p => Number(p.harga)).filter(v => !isNaN(v) && v > 0);
      if (prices.length) return { min: Math.min(...prices), max: Math.max(...prices) };
    }
    return { min: 0, max: 1 };
  }, [geoData, pasars]);

  const provinsiSet = useMemo(() => {
    const s = new Set();
    pasars.forEach(p => { if (p.provinsi_id) s.add(p.provinsi_id); });
    return s;
  }, [pasars]);

  return (
    <GeoAgriLayout title="Peta Pasar">
      <Head><title>Peta Pasar — GeoAgri</title></Head>

      <div className="page-header">
        <h1 className="page-title">Peta Pasar Komoditas</h1>
        <p className="page-desc">Visualisasi sebaran pasar dan harga komoditas secara geografis.</p>
      </div>

      <div className="filter-bar">
        <span className="filter-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filter:
        </span>
        <select value={selectedId || ""} onChange={e => setSelectedId(e.target.value)} className="filter-select">
          {komoditas.map(k => <option key={k.id} value={k.id}>{k.nama} ({k.satuan || "—"})</option>)}
        </select>
        <Select
          name="provinsi"
          options={provinsiList.map(p => ({ value: String(p.id), label: p.nama }))}
          value={provinsiList
            .filter(p => provinsiIds.includes(String(p.id)))
            .map(p => ({ value: String(p.id), label: p.nama }))
          }
          onChange={vals => setProvinsiIds((vals ?? []).map(v => v.value))}
          placeholder="Cari Provinsi..."
          isMulti
          isClearable
          className="react-select"
          classNamePrefix="rs"
          styles={{
            control: (base) => ({ ...base, minHeight: 36, fontSize: 13 }),
            menu: (base) => ({ ...base, zIndex: 999 }),
          }}
        />
        <Select
          name="kabkota"
          options={kabkotaOptions}
          value={kabkotaOption}
          onChange={setKabkotaOption}
          placeholder="Cari Kab/Kota..."
          isDisabled={!provinsiIds.length}
          isClearable
          className="react-select"
          classNamePrefix="rs"
          styles={{
            control: (base) => ({ ...base, minHeight: 36, fontSize: 13 }),
            menu: (base) => ({ ...base, zIndex: 999 }),
          }}
        />
        <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="filter-date-input" />
        <button onClick={fetchData} className="filter-btn">Terapkan</button>
      </div>

      <div className="stat-row">
        <div className="stat-mini">
          <div className="stat-mini-value">{pasars.length || stats?.meta?.total_pasar || "—"}</div>
          <div className="stat-mini-label">Pasar</div>
        </div>
        <div className="stat-mini">
          <div className="stat-mini-value">{geoData?.features?.length || (layer === "markers" ? pasars.length : 0) || "—"}</div>
          <div className="stat-mini-label">{level === "kabupaten" ? "Kabupaten/Kota" : "Provinsi"}</div>
        </div>
        <div className="stat-mini">
          <div className="stat-mini-value">{provinsiSet.size || stats?.meta?.total_provinsi || "—"}</div>
          <div className="stat-mini-label">Provinsi</div>
        </div>
        <div className="stat-mini">
          <div className="stat-mini-value">{fmt(stats?.statistik?.rata)}</div>
          <div className="stat-mini-label">Rata-rata Harga</div>
        </div>
      </div>

      <div className="geo-card" style={{ overflow: "hidden" }}>
        <div className="map-panel-header">
          <span className="map-panel-title">Peta Sebaran Harga</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={() => setLayer("choropleth")}
              className={`layer-btn ${layer === "choropleth" ? "active" : ""}`}>
              {level === "provinsi" ? "Provinsi" : "Kab/Kota"}
            </button>
            <button onClick={() => setLayer("markers")}
              className={`layer-btn ${layer === "markers" ? "active" : ""}`}>
              Pasar
            </button>
            <span className="map-panel-divider" style={{ width: 1, height: 18, background: "var(--border)", margin: "0 4px", flexShrink: 0 }} />
            <div className="level-toggle">
              {["provinsi", "kabupaten"].map(lvl => (
                <button key={lvl} onClick={() => setLevel(lvl)}
                  className={`level-btn ${level === lvl ? "active" : ""}`}>
                  {lvl === "provinsi" ? "Provinsi" : "Kab/Kota"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="map-wrap" style={{ position: "relative", height: 480 }}>
          {loading && <div className="map-loading-overlay" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.65)", zIndex: 1000 }}>
            <div className="map-loading-spinner" style={{ width: 38, height: 38, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "mapSpin .7s linear infinite" }} />
          </div>}
          {layer === "choropleth" ? (
            <LeafletHeatmapMap geojsonData={choroplethReady} />
          ) : (
            <LeafletMapDynamic pasarData={markerReady} hargaMin={hargaMinMax.min} hargaMax={hargaMinMax.max} />
          )}
        </div>

        <div className="map-legend">
          {layer === "choropleth" && (
            <>
              <span className="map-legend-item"><span className="map-legend-bar" style={{ background: "#22c55e" }} />Murah</span>
              <span className="map-legend-item"><span className="map-legend-bar" style={{ background: "#f97316" }} />Sedang</span>
              <span className="map-legend-item"><span className="map-legend-bar" style={{ background: "#ef4444" }} />Mahal</span>
            </>
          )}
          {layer === "markers" && (
            <>
              <span className="map-legend-item"><span className="map-legend-dot" style={{ background: "#22c55e" }} />Di Bawah Rata-rata</span>
              <span className="map-legend-item"><span className="map-legend-dot" style={{ background: "#f97316" }} />Rata-rata</span>
              <span className="map-legend-item"><span className="map-legend-dot" style={{ background: "#ef4444" }} />Di Atas Rata-rata</span>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes mapSpin { to { transform: rotate(360deg); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </GeoAgriLayout>
  );
}
