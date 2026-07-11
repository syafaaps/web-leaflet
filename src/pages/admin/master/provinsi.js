import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import GeoAgriLayout from "@components/GeoAgriLayout";
import AdminGuard from "@components/AdminGuard";
import Panel from "@components/UI/Panel";
import Spinner from "@components/UI/Spinner";
import { apiGet, apiPost, apiPut, apiDelete } from "@lib/api";

export default function MasterProvinsi() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nama: "", keycode: "", latitude: "", longitude: "" });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, per_page: 15 });
    if (search) params.set("search", search);
    const res = await apiGet(`/api/admin/provinsi?${params}`);
    if (res?.status === "success") {
      setData(res.data);
      setMeta(res.meta);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setForm({ nama: "", keycode: "", latitude: "", longitude: "" });
    setModal("create");
  };

  const openEdit = (item) => {
    setForm({
      nama: item.nama || "",
      keycode: item.keycode || "",
      latitude: item.latitude || "",
      longitude: item.longitude || "",
    });
    setModal(item);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = { ...form };
    if (!body.latitude) delete body.latitude;
    if (!body.longitude) delete body.longitude;
    if (!body.keycode) delete body.keycode;

    if (modal === "create") {
      await apiPost("/api/admin/provinsi", body);
    } else {
      await apiPut(`/api/admin/provinsi/${modal.id_provinsi || modal.id}`, body);
    }
    setModal(null);
    fetchData();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus provinsi ini?")) return;
    await apiDelete(`/api/admin/provinsi/${id}`);
    fetchData();
  };

  return (
    <AdminGuard>
      <GeoAgriLayout title="Data Master Provinsi">
        <Head><title>Data Master Provinsi — GeoAgri</title></Head>

        <div className="page-header">
          <h1 className="page-title">Data Master Provinsi</h1>
          <p className="page-desc">Kelola data provinsi untuk sistem monitoring harga komoditas.</p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari provinsi..."
            style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)", width: 260, background: "var(--bg-white)" }}
          />
          <button onClick={openCreate} className="geo-btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>+ Tambah Provinsi</button>
        </div>

        <Panel>
          {loading ? <Spinner /> : (
            <div style={{ overflowX: "auto" }}>
              <table className="geo-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nama Provinsi</th>
                    <th>Keycode</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th style={{ width: 120 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, i) => (
                    <tr key={item.id_provinsi || i}>
                      <td className="geo-mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>{(page - 1) * 15 + i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.nama}</td>
                      <td className="geo-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.keycode || "—"}</td>
                      <td className="geo-mono" style={{ fontSize: 12 }}>{item.latitude || "—"}</td>
                      <td className="geo-mono" style={{ fontSize: 12 }}>{item.longitude || "—"}</td>
                      <td>
                        <button onClick={() => openEdit(item)} style={{ marginRight: 8, padding: "4px 10px", fontSize: 11, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "transparent", cursor: "pointer", fontWeight: 600, color: "var(--primary)" }}>Edit</button>
                        <button onClick={() => handleDelete(item.id_provinsi || item.id)} style={{ padding: "4px 10px", fontSize: 11, borderRadius: "var(--radius-sm)", border: "1px solid rgba(220,38,38,.3)", background: "transparent", cursor: "pointer", fontWeight: 600, color: "var(--red)" }}>Hapus</button>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Tidak ada data</td></tr>}
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
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{modal === "create" ? "Tambah Provinsi" : "Edit Provinsi"}</div>
              {["nama", "keycode", "latitude", "longitude"].map(field => (
                <div key={field} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4, textTransform: "capitalize" }}>{field}</label>
                  <input
                    type={field === "latitude" || field === "longitude" ? "number" : "text"}
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={field}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)" }}
                  />
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
