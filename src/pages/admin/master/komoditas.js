import MasterPage from "@components/MasterPage";
export default function () {
  return (
    <MasterPage
      title="Master Komoditas"
      endpoint="/api/master/komoditas"
      columns={[
        { key: "nama", label: "Nama" },
        { key: "satuan", label: "Satuan" },
      ]}
    />
  );
}
