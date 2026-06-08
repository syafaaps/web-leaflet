// pages/heatmap.js
// Page shell — hanya merender DashboardShell
// Semua logika ada di components/MapDashboard/

import Head from 'next/head';
import DashboardShell from '@components/MapDashboard/DashboardShell';

export default function HeatmapPage() {
  return (
    <>
      <Head>
        <title>Dashboard Harga Komoditas — Jawa Timur</title>
        <meta name="description" content="Peta sebaran harga komoditas Jawa Timur per pasar dan per kabupaten/kota" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <DashboardShell />
    </>
  );
}