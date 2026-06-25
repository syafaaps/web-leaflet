import Head from "next/head";
import DashboardShell from "@components/MapDashboard/DashboardShell";

export default function PetaKomoditasPage() {
  return (
    <>
      <Head>
        <title>Peta Komoditas — GeoAgri</title>
        <meta name="description" content="Peta sebaran harga komoditas per provinsi dan kabupaten/kota" />
      </Head>
      <DashboardShell />
    </>
  );
}
