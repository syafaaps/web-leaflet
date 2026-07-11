import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import GeoAgriLayout from "@components/GeoAgriLayout";
import AdminGuard from "@components/AdminGuard";
import Panel from "@components/UI/Panel";
import Spinner from "@components/UI/Spinner";
import { apiGet, apiPost, apiPut, apiDelete } from "@lib/api";

export default function MasterKabkota() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [provinsiList, setProvinsiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterProv, setFilterProv] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ kab_nama: "", provinsi_id: "", kab_keycode: "", latitude: "", longitude: "" });
  const [saving, setSaving] = useState(false);

  const fetchProvinsi = useCallback(async () => {
    const res = await apiGet("/api/admin/provinsi?per_page=100");
    if (res?.status === "success") setProvinsiList(res.data || []);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, per_page: 15 });
    if (search) params.set("search", search);
    if (filterProv) params.set("provinsi_id", filterProv);
    const res = await apiGet(`/api/admin/kabkota?${params}`);
    if (res?.status === "success") { setData(res.data); setMeta(res.meta); }
    setLoading(false);
  }, [page, search, filterProv]);

  useEffect(() => { fetchProvinsi(); }, [fetchProvinsi]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setForm({ kab_nama: "", provinsi_id: "", kab_keycode: "", latitude: "", longitude: "" }); setModal("create"); };
  const openEdit = (item) => {
    setForm({ kab_nama: item.kab_nama || "", provinsi_id: item.provinsi_id || "", kab_keycode: item.kab_keycode || "", latitude: item.latitude || "", longitude: item.longitude || "" });
    setModal(item);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = { ...form };
    ["latitude", "longitude", "kab_keycode"].forEach(k => { if (!body[k]) delete body[k]; });
    if (modal === "create") await apiPost("/api/admin/kabkota", body);
    else await apiPut(`/api/admin/kabkota/${modal.id}`, body);
    setModal(null); fetchData(); setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus kabupaten/kota ini?")) return;
    await apiDelete(`/api/admin/kabkota/${id}`); fetchData();
  };

  const getProvName = (id) => provinsiList.find(p => p.id_provinsi == id)?.nama || "—";

  return (
    <AdminGuard>
      <GeoAgriLayout title="Data Master Kabupaten/Kota">
        <Head><title>Data Master Kabupaten/Kota — GeoAgri</title></Head>

        <div className="page-header">
          <h1 className="page-title">Data Master Kabupaten/Kota</h1>
          <p className="page-desc">Kelola data kabupaten dan kota per provinsi.</p>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari kabupaten/kota..." style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)", width: 260, background: "var(--bg-white)" }} />
          <select value={filterProv} onChange={e => { setFilterProv(e.target.value); setPage(1); }} style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)", background: "var(--bg-white)" }}>
            <option value="">Semua Provinsi</option>
            {provinsiList.map(p => <option key={p.id_provinsi} value={p.id_provinsi}>{p.nama}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <button onClick={openCreate} className="geo-btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>+ Tambah</button>
        </div>

        <Panel>
          {loading ? <Spinner /> : (
            <div style={{ overflowX: "auto" }}>
              <table className="geo-table">
                <thead>
                  <tr><th>#</th><th>Nama</th><th>Provinsi</th><th>Keycode</th><th>Lat</th><th>Lng</th><th style={{ width: 120 }}></th></tr>
                </thead>
                <tbody>
                  {data.map((item, i) => (
                    <tr key={item.id || i}>
                      <td className="geo-mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>{(page - 1) * 15 + i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.kab_nama}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{getProvName(item.provinsi_id)}</td>
                      <td className="geo-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.kab_keycode || "—"}</td>
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
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{modal === "create" ? "Tambah Kabupaten/Kota" : "Edit Kabupaten/Kota"}</div>
              {[
                { label: "Nama", key: "kab_nama" },
                { label: "Provinsi", key: "provinsi_id", type: "select", options: provinsiList.map(p => ({ value: p.id_provinsi, label: p.nama })) },
                { label: "Keycode", key: "kab_keycode" },
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
