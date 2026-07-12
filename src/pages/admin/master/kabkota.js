import MasterPage from "@components/MasterPage";
export default function () {
  return (
    <MasterPage
      title="Kabupaten/Kota"
      endpoint="/api/master/kabkota?provinsi_id=1"
      columns={[
        { key: "nama", label: "Nama" },
        { key: "provinsi_id", label: "Provinsi ID" },
      ]}
    />
  );
}
