import MasterPage from "@components/MasterPage";
export default function () {
  return (
    <MasterPage
      title="Provinsi"
      endpoint="/api/master/provinsi"
      columns={[
        { key: "nama", label: "Nama Provinsi" },
        { key: "latitude", label: "Latitude" },
        { key: "longitude", label: "Longitude" },
      ]}
    />
  );
}
