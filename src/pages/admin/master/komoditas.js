import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import GeoAgriLayout from "@components/GeoAgriLayout";
import AdminGuard from "@components/AdminGuard";
import Panel from "@components/UI/Panel";
import Spinner from "@components/UI/Spinner";
import { apiGet, apiPost, apiPut, apiDelete } from "@lib/api";

export default function MasterKomoditas() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [kategoriList, setKategoriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [modal, setModal] = useState(null);
  const [modalKategori, setModalKategori] = useState(null);
  const [form, setForm] = useState({ nama: "", satuan: "", kategori_id: "" });
  const [formKategori, setFormKategori] = useState({ kategori: "" });
  const [saving, setSaving] = useState(false);

  const fetchKategori = useCallback(async () => {
    const res = await apiGet("/api/admin/kategori?per_page=100");
    if (res?.status === "success") setKategoriList(res.data || []);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, per_page: 15 });
    if (search) params.set("search", search);
    if (filterKategori) params.set("kategori_id", filterKategori);
    const res = await apiGet(`/api/admin/komoditas?${params}`);
    if (res?.status === "success") { setData(res.data); setMeta(res.meta); }
    setLoading(false);
  }, [page, search, filterKategori]);

  useEffect(() => { fetchKategori(); }, [fetchKategori]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setForm({ nama: "", satuan: "", kategori_id: "" }); setModal("create"); };
  const openEdit = (item) => {
    setForm({ nama: item.nama || "", satuan: item.satuan || "", kategori_id: item.kategori_id || "" });
    setModal(item);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = { ...form };
    if (!body.satuan) delete body.satuan;
    if (!body.kategori_id) delete body.kategori_id;
    if (modal === "create") await apiPost("/api/admin/komoditas", body);
    else await apiPut(`/api/admin/komoditas/${modal.id_master_komoditas}`, body);
    setModal(null); fetchData(); setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus komoditas ini?")) return;
    await apiDelete(`/api/admin/komoditas/${id}`); fetchData();
  };

  const handleSaveKategori = async () => {
    if (!formKategori.kategori.trim()) return;
    setSaving(true);
    if (modalKategori === "create") await apiPost("/api/admin/kategori", formKategori);
    else await apiPut(`/api/admin/kategori/${modalKategori.id}`, formKategori);
    setModalKategori(null); fetchKategori(); setSaving(false);
  };

  const handleDeleteKategori = async (id) => {
    if (!confirm("Hapus kategori ini?")) return;
    await apiDelete(`/api/admin/kategori/${id}`); fetchKategori();
  };

  return (
    <AdminGuard>
      <GeoAgriLayout title="Data Master Komoditas">
        <Head><title>Data Master Komoditas — GeoAgri</title></Head>

        <div className="page-header">
          <h1 className="page-title">Data Master Komoditas</h1>
          <p className="page-desc">Kelola data komoditas dan kategori produk pertanian.</p>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari komoditas..." style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)", width: 260, background: "var(--bg-white)" }} />
          <select value={filterKategori} onChange={e => { setFilterKategori(e.target.value); setPage(1); }} style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)", background: "var(--bg-white)" }}>
            <option value="">Semua Kategori</option>
            {kategoriList.map(k => <option key={k.id} value={k.id}>{k.kategori}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <button onClick={() => { setFormKategori({ kategori: "" }); setModalKategori("create"); }} style={{ padding: "8px 16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-white)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Kategori</button>
          <button onClick={openCreate} className="geo-btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>+ Tambah Komoditas</button>
        </div>

        <Panel>
          {loading ? <Spinner /> : (
            <div style={{ overflowX: "auto" }}>
              <table className="geo-table">
                <thead>
                  <tr><th>#</th><th>Nama Komoditas</th><th>Satuan</th><th>Kategori</th><th style={{ width: 120 }}></th></tr>
                </thead>
                <tbody>
                  {data.map((item, i) => (
                    <tr key={item.id_master_komoditas || i}>
                      <td className="geo-mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>{(page - 1) * 15 + i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.nama}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.satuan || "—"}</td>
                      <td>
                        {item.kategori ? (
                          <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "var(--primary-10)", color: "var(--primary)" }}>{item.kategori.kategori}</span>
                        ) : "—"}
                      </td>
                      <td>
                        <button onClick={() => openEdit(item)} style={{ marginRight: 8, padding: "4px 10px", fontSize: 11, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "transparent", cursor: "pointer", fontWeight: 600, color: "var(--primary)" }}>Edit</button>
                        <button onClick={() => handleDelete(item.id_master_komoditas)} style={{ padding: "4px 10px", fontSize: 11, borderRadius: "var(--radius-sm)", border: "1px solid rgba(220,38,38,.3)", background: "transparent", cursor: "pointer", fontWeight: 600, color: "var(--red)" }}>Hapus</button>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Tidak ada data</td></tr>}
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

        {/* Modal Komoditas */}
        {modal && (
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{modal === "create" ? "Tambah Komoditas" : "Edit Komoditas"}</div>
              {[
                { label: "Nama Komoditas", key: "nama" },
                { label: "Satuan", key: "satuan" },
                { label: "Kategori", key: "kategori_id", type: "select", options: kategoriList.map(k => ({ value: k.id, label: k.kategori })) },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{field.label}</label>
                  {field.type === "select" ? (
                    <select value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)" }}>
                      <option value="">Pilih...</option>
                      {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)" }} />
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

        {/* Modal Kategori */}
        {modalKategori && (
          <div className="modal-overlay" onClick={() => setModalKategori(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{modalKategori === "create" ? "Tambah Kategori" : "Edit Kategori"}</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Nama Kategori</label>
                <input type="text" value={formKategori.kategori} onChange={e => setFormKategori({ kategori: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>Kategori yang ada:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {kategoriList.map(k => (
                    <span key={k.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: "var(--bg-muted)", color: "var(--text)" }}>
                      {k.kategori}
                      <button onClick={() => handleDeleteKategori(k.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 14, lineHeight: 1 }}>&times;</button>
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
                <button onClick={() => setModalKategori(null)} style={{ padding: "8px 16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Batal</button>
                <button onClick={handleSaveKategori} disabled={saving} className="geo-btn-primary" style={{ fontSize: 13 }}>{saving ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </div>
          </div>
        )}
      </GeoAgriLayout>
    </AdminGuard>
  );
}
