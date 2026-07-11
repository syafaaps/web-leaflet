import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import GeoAgriLayout from "@components/GeoAgriLayout";
import AdminGuard from "@components/AdminGuard";
import Panel from "@components/UI/Panel";
import Spinner from "@components/UI/Spinner";
import { apiGet, apiPost, apiPut, apiDelete } from "@lib/api";

export default function MasterPasar() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [provinsiList, setProvinsiList] = useState([]);
  const [kabkotaList, setKabkotaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterProv, setFilterProv] = useState("");
  const [filterKabkota, setFilterKabkota] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ psr_nama: "", kabkota_id: "", psr_status: "", latitude: "", longitude: "" });
  const [saving, setSaving] = useState(false);

  const fetchProvinsi = useCallback(async () => {
    const res = await apiGet("/api/admin/provinsi?per_page=100");
    if (res?.status === "success") setProvinsiList(res.data || []);
  }, []);

  const fetchKabkota = useCallback(async (provId) => {
    if (!provId) { setKabkotaList([]); return; }
    const res = await apiGet(`/api/admin/kabkota?provinsi_id=${provId}&per_page=200`);
    if (res?.status === "success") setKabkotaList(res.data || []);
  }, []);

  useEffect(() => { fetchProvinsi(); }, [fetchProvinsi]);
  useEffect(() => { fetchKabkota(filterProv); }, [filterProv, fetchKabkota]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, per_page: 15 });
    if (search) params.set("search", search);
    if (filterProv) params.set("provinsi_id", filterProv);
    if (filterKabkota) params.set("kabkota_id", filterKabkota);
    const res = await apiGet(`/api/admin/pasar?${params}`);
    if (res?.status === "success") { setData(res.data); setMeta(res.meta); }
    setLoading(false);
  }, [page, search, filterProv, filterKabkota]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setForm({ psr_nama: "", kabkota_id: "", psr_status: "", latitude: "", longitude: "" }); setModal("create"); };
  const openEdit = (item) => {
    setForm({ psr_nama: item.psr_nama || "", kabkota_id: item.kabkota_id || "", psr_status: item.psr_status || "", latitude: item.latitude || "", longitude: item.longitude || "" });
    setModal(item);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = { ...form };
    ["latitude", "longitude", "psr_status"].forEach(k => { if (!body[k]) delete body[k]; });
    if (modal === "create") await apiPost("/api/admin/pasar", body);
    else await apiPut(`/api/admin/pasar/${modal.id}`, body);
    setModal(null); fetchData(); setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus pasar ini?")) return;
    await apiDelete(`/api/admin/pasar/${id}`); fetchData();
  };

  return (
    <AdminGuard>
      <GeoAgriLayout title="Data Master Pasar">
        <Head><title>Data Master Pasar — GeoAgri</title></Head>

        <div className="page-header">
          <h1 className="page-title">Data Master Pasar</h1>
          <p className="page-desc">Kelola data pasar tradisional per kabupaten/kota.</p>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari pasar..." style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)", width: 220, background: "var(--bg-white)" }} />
          <select value={filterProv} onChange={e => { setFilterProv(e.target.value); setFilterKabkota(""); setPage(1); }} style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)", background: "var(--bg-white)" }}>
            <option value="">Semua Provinsi</option>
            {provinsiList.map(p => <option key={p.id_provinsi} value={p.id_provinsi}>{p.nama}</option>)}
          </select>
          <select value={filterKabkota} onChange={e => { setFilterKabkota(e.target.value); setPage(1); }} disabled={!filterProv} style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)", background: "var(--bg-white)", opacity: filterProv ? 1 : 0.5 }}>
            <option value="">Semua Kab/Kota</option>
            {kabkotaList.map(k => <option key={k.id} value={k.id}>{k.kab_nama}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <button onClick={openCreate} className="geo-btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>+ Tambah</button>
        </div>

        <Panel>
          {loading ? <Spinner /> : (
            <div style={{ overflowX: "auto" }}>
              <table className="geo-table">
                <thead>
                  <tr><th>#</th><th>Nama Pasar</th><th>Kabupaten/Kota</th><th>Status</th><th>Lat</th><th>Lng</th><th style={{ width: 120 }}></th></tr>
                </thead>
                <tbody>
                  {data.map((item, i) => (
                    <tr key={item.id || i}>
                      <td className="geo-mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>{(page - 1) * 15 + i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.psr_nama}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.kabupatenKota?.kab_nama || "—"}</td>
                      <td style={{ fontSize: 12 }}>{item.psr_status || "—"}</td>
                      <td className="geo-mono" style={{ fontSize: 12 }}>{item.latitude || "—"}</td>
                      <td className="geo-mono" style={{ fontSize: 12 }}>{item.longitude || "—"}</td>
                      <td>
                        <button onClick={() => openEdit(item)} style={{ marginRight: 8, padding: "4px 10px", fontSize: 11, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "transparent", cursor: "pointer", fontWeight: 600, color: "var(--primary)" }}>Edit</button>
                        <button onClick={() => handleDelete(item.id)} style={{ padding: "4px 10px", fontSize: 11, borderRadius: "var(--radius-sm)", border: "1px solid rgba(220,38,38,.3)", background: "transparent", cursor: "pointer", fontWeight: 600, color: "var(--red)" }}>Hapus</button>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Tidak ada data</td></tr>}
                </tbody>
              </table>
            </div>
          )}
          {meta.last_page > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 16 }}>
              {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`geo-page-btn ${p === page ? "active" : ""}`}>{p}</button>
              ))}
            </div>
          )}
        </Panel>

        {modal && (
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{modal === "create" ? "Tambah Pasar" : "Edit Pasar"}</div>
              {[
                { label: "Nama Pasar", key: "psr_nama" },
                { label: "Kabupaten/Kota", key: "kabkota_id", type: "select", options: kabkotaList.map(k => ({ value: k.id, label: k.kab_nama })) },
                { label: "Status", key: "psr_status" },
                { label: "Latitude", key: "latitude", type: "number" },
                { label: "Longitude", key: "longitude", type: "number" },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{field.label}</label>
                  {field.type === "select" ? (
                    <select value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)" }}>
                      <option value="">Pilih...</option>
                      {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type={field.type || "text"} value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)" }} />
                  )}
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
                <button onClick={() => setModal(null)} style={{ padding: "8px 16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Batal</button>
                <button onClick={handleSave} disabled={saving} className="geo-btn-primary" style={{ fontSize: 13 }}>{saving ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </div>
          </div>
        )}
      </GeoAgriLayout>
    </AdminGuard>
  );
}
