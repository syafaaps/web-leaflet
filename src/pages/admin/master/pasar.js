import MasterPage from "@components/MasterPage";
export default function () {
  return (
    <MasterPage
      title="Pasar"
      endpoint="/api/master/pasar"
      columns={[
        { key: "nama", label: "Nama Pasar" },
        { key: "kabupaten", label: "Kabupaten/Kota" },
        { key: "kabupaten_id", label: "Kabupaten ID" },
      ]}
    />
  );
}
