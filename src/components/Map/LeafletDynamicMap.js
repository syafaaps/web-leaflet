// components/Map/LeafletDynamicMap.js
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import styles from './Map.module.scss';

// ── Konfigurasi warna per kategori ──────────────────────────────────────────
const KATEGORI_CONFIG = {
  Mahal:  { fill: '#ef4444', stroke: '#b91c1c', glow: 'rgba(239,68,68,0.4)',  emoji: '🔴' },
  Sedang: { fill: '#f97316', stroke: '#c2410c', glow: 'rgba(249,115,22,0.4)', emoji: '🟠' },
  Murah:  { fill: '#22c55e', stroke: '#15803d', glow: 'rgba(34,197,94,0.4)',  emoji: '🟢' },
};

function getConfig(kategori) {
  return KATEGORI_CONFIG[kategori] ?? KATEGORI_CONFIG['Sedang'];
}

// ── SVG teardrop pin — runcing bawah, dot putih di tengah ───────────────────
function createPinIcon(kategori) {
  const { fill, stroke, glow } = getConfig(kategori);
  const id = `glow-${kategori}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
    <defs>
      <filter id="${id}" x="-50%" y="-30%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${glow}" flood-opacity="1"/>
      </filter>
    </defs>
    <path
      d="M15 2C8.373 2 3 7.373 3 14C3 22 15 36 15 36C15 36 27 22 27 14C27 7.373 21.627 2 15 2Z"
      fill="${fill}" stroke="${stroke}" stroke-width="1.5"
      filter="url(#${id})"
    />
    <circle cx="15" cy="13.5" r="6" fill="white" opacity="0.92"/>
    <circle cx="15" cy="13.5" r="2.8" fill="${stroke}"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [30, 38],
    iconAnchor: [15, 36],
    popupAnchor: [0, -38],
  });
}

// ── Popup HTML per pasar ─────────────────────────────────────────────────────
function buildPopupHTML(item) {
  const { fill, stroke, emoji } = getConfig(item.kategori);
  const harga    = item.harga    ? `Rp ${Number(item.harga).toLocaleString('id-ID')}` : '-';
  const rata     = item.rata_prov? `Rp ${Number(item.rata_prov).toLocaleString('id-ID')}` : '-';
  const pct      = Number(item.persen_deviasi ?? 0);
  const pctStr   = `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`;
  const pctColor = pct > 0 ? '#ef4444' : '#22c55e';
  const tgl      = item.tanggal
    ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

  return `
    <div style="font-family:'DM Sans',system-ui,sans-serif;min-width:210px;max-width:250px;">
      <div style="background:${fill};padding:10px 13px 8px;border-radius:9px 9px 0 0;">
        <div style="font-weight:800;font-size:13px;color:white;margin-bottom:2px;line-height:1.3;">${item.nama_pasar}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.85);">📍 ${item.kabupaten}</div>
      </div>
      <div style="padding:10px 13px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 9px 9px;background:#fff;">
        <div style="font-size:10.5px;color:#9ca3af;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;">
          ${item.komoditas_nama ?? '-'} · ${tgl}
        </div>
        <div style="font-size:24px;font-weight:800;color:${stroke};letter-spacing:-1px;margin-bottom:9px;line-height:1;">
          ${harga}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11.5px;border-top:1px solid #f3f4f6;padding-top:7px;">
          <div>
            <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.04em;margin-bottom:1px;">Rata prov.</div>
            <div style="font-weight:600;color:#374151;">${rata}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.04em;margin-bottom:1px;">Deviasi</div>
            <div style="font-weight:700;color:${pctColor};">${pctStr}</div>
          </div>
        </div>
        <div style="margin-top:9px;">
          <span style="
            display:inline-block;padding:3px 11px;border-radius:20px;
            font-size:11px;font-weight:700;letter-spacing:.03em;
            background:${fill}18;color:${stroke};border:1px solid ${fill}50;
          ">${emoji} ${item.kategori}</span>
        </div>
      </div>
    </div>`;
}

// ── Layer marker, diperbarui setiap pasarData berubah ───────────────────────
function PasarMarkerLayer({ pasarData }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    } else {
      layerRef.current.clearLayers();
    }

    if (!pasarData?.length) return;

    pasarData.forEach((item) => {
      const lat = Number(item.latitude);
      const lng = Number(item.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      L.marker([lat, lng], { icon: createPinIcon(item.kategori) })
        .bindPopup(buildPopupHTML(item), {
          maxWidth: 270,
          className: 'pasar-popup',
        })
        .addTo(layerRef.current);
    });
  }, [pasarData, map]);

  return null;
}

// ── Komponen utama ───────────────────────────────────────────────────────────
const LeafletMapDynamic = ({ className, pasarData = [] }) => {
  const mapClassName = [styles.map, className].filter(Boolean).join(' ');

  return (
    <>
      <style>{`
        .pasar-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 10px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.14);
          overflow: hidden;
          border: none;
        }
        .pasar-popup .leaflet-popup-content { margin: 0; width: auto !important; }
        .pasar-popup .leaflet-popup-tip-container { display: none; }
      `}</style>

      <MapContainer
        className={mapClassName}
        center={[-7.5, 112.5]}
        zoom={8}
        style={{ height: '100%', width: '100%' }}
      >
        {/* CartoDB Positron: tile bersih, cocok buat data viz */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />

        <PasarMarkerLayer pasarData={pasarData} />
      </MapContainer>
    </>
  );
};

export default LeafletMapDynamic;
// import { useEffect } from 'react';
// import L from 'leaflet';
// import * as ReactLeaflet from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import 'leaflet.heat';

// import styles from './Map.module.scss';

// const { MapContainer, TileLayer, Marker, Popup, useMap } = ReactLeaflet;

// // ── Fix ikon default Leaflet (wajib di Next.js) ──────────────────────────────
// function FixLeafletIcons() {
//   useEffect(() => {
//     delete L.Icon.Default.prototype._getIconUrl;
//     L.Icon.Default.mergeOptions({
//       iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
//       iconUrl: '/leaflet/images/marker-icon.png',
//       shadowUrl: '/leaflet/images/marker-shadow.png',
//     });
//   }, []);
//   return null;
// }

// // ── Heatmap layer (data statis, bisa diganti dinamis nanti) ──────────────────
// function HeatmapLayer() {
//   const map = useMap();

//   useEffect(() => {
//     if (!map) return;

//     const heatData = [
//       [-7.2575, 112.7521, 1.0],
//       [-7.9666, 112.6326, 0.8],
//       [-7.6298, 111.5239, 0.6],
//       [-7.1500, 112.6500, 0.7],
//       [-8.0650, 112.1660, 0.9],
//     ];

//     const heat = L.heatLayer(heatData, {
//       radius: 40,
//       blur: 25,
//       gradient: {
//         0.2: 'green',
//         0.5: 'yellow',
//         0.8: 'orange',
//         1: 'red',
//       },
//     });

//     heat.addTo(map);

//     return () => {
//       map.removeLayer(heat);
//     };
//   }, [map]);

//   return null;
// }

// // ── Komponen utama ────────────────────────────────────────────────────────────
// const LeafletMapDynamic = ({ className, pasarData = [] }) => {
//   let mapClassName = styles.map;
//   if (className) mapClassName = `${mapClassName} ${className}`;

//   return (
//     <MapContainer
//       className={mapClassName}
//       center={[-7.5, 112.5]}
//       zoom={8}
//       style={{ height: '100%', width: '100%' }}
//     >
//       {/* Fix ikon, harus di dalam MapContainer */}
//       <FixLeafletIcons />

//       <TileLayer
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//       />

//       <HeatmapLayer />

//       {/* ── Marker pasar dari API ── */}
//       {pasarData.map((item, index) => {
//         const lat = Number(item.latitude);
//         const lng = Number(item.longitude);

//         // Skip kalau koordinat tidak valid
//         if (isNaN(lat) || isNaN(lng)) return null;

//         return (
//           <Marker key={item.id ?? index} position={[lat, lng]}>
//             <Popup>
//               <div style={{
//                 fontFamily: 'DM Sans, sans-serif',
//                 fontSize: '13px',
//                 lineHeight: '1.5',
//                 minWidth: '160px'
//               }}>
//                 <div style={{
//                   fontWeight: 700,
//                   fontSize: '14px',
//                   color: '#0f4c35',
//                   marginBottom: '4px',
//                   borderBottom: '1px solid #e2e8e4',
//                   paddingBottom: '4px'
//                 }}>
//                   🏪 {item.nama_pasar}
//                 </div>

//                 {item.kabupaten && (
//                   <div style={{ color: '#4a6358', marginBottom: '2px' }}>
//                     📍 {item.kabupaten}
//                   </div>
//                 )}

//                 {item.kategori_harga && (
//                   <div style={{ marginTop: '6px' }}>
//                     <span style={{
//                       display: 'inline-block',
//                       padding: '2px 8px',
//                       borderRadius: '20px',
//                       fontSize: '11px',
//                       fontWeight: 600,
//                       background:
//                         item.kategori_harga === 'Murah' ? '#d4edda' :
//                         item.kategori_harga === 'Sedang' ? '#fef3c7' : '#fee2e2',
//                       color:
//                         item.kategori_harga === 'Murah' ? '#16a34a' :
//                         item.kategori_harga === 'Sedang' ? '#d97706' : '#ef4444',
//                     }}>
//                       {item.kategori_harga}
//                     </span>
//                   </div>
//                 )}

//                 {item.harga && (
//                   <div style={{ marginTop: '4px', fontWeight: 600, color: '#0f2318' }}>
//                     Rp {Number(item.harga).toLocaleString('id-ID')}
//                   </div>
//                 )}
//               </div>
//             </Popup>
//           </Marker>
//         );
//       })}

//     </MapContainer>
//   );
// };

// export default LeafletMapDynamic;
// import { useEffect } from 'react';
// import L from 'leaflet';
// import * as ReactLeaflet from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import 'leaflet.heat';

// import styles from './Map.module.scss';

// const { MapContainer, TileLayer, useMap } = ReactLeaflet;

// function HeatmapLayer() {
//   const map = useMap();

//   useEffect(() => {
//     if (!map) return;

//     const heatData = [
//       [-7.2575, 112.7521, 1.0],
//       [-7.9666, 112.6326, 0.8],
//       [-7.6298, 111.5239, 0.6],
//       [-7.1500, 112.6500, 0.7],
//       [-8.0650, 112.1660, 0.9],
//     ];

//     const heat = L.heatLayer(heatData, {
//       radius: 40,
//       blur: 25,
//       gradient: {
//         0.2: 'green',
//         0.5: 'yellow',
//         0.8: 'orange',
//         1: 'red',
//       },
//     });

//     heat.addTo(map);

//     return () => {
//       map.removeLayer(heat);
//     };
//   }, [map]);

//   return null;
// }

// const LeafletMapDynamic = ({ className }) => {
//   let mapClassName = styles.map;

//   if (className) {
//     mapClassName = `${mapClassName} ${className}`;
//   }

//   useEffect(() => {
//     delete L.Icon.Default.prototype._getIconUrl;
//     L.Icon.Default.mergeOptions({
//       iconRetinaUrl: 'leaflet/images/marker-icon-2x.png',
//       iconUrl: 'leaflet/images/marker-icon.png',
//       shadowUrl: 'leaflet/images/marker-shadow.png',
//     });
//   }, []);

//   return (
//     <MapContainer
//       className={mapClassName}
//       center={[-7.5, 112.5]}
//       zoom={8}
//       style={{ height: '100%', width: '100%' }}
//     >
//       <TileLayer
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       />

//       <HeatmapLayer />
//     </MapContainer>
//   );
// };

// export default LeafletMapDynamic;
// import { useEffect } from 'react';
// import Leaflet from 'leaflet';
// import * as ReactLeaflet from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';

// import styles from './Map.module.scss';

// const { MapContainer } = ReactLeaflet;

// const Map = ({ children, className, width, height, ...rest }) => {
//   let mapClassName = styles.map;

//   if ( className ) {
//     mapClassName = `${mapClassName} ${className}`;
//   }

//   useEffect(() => {
//     (async function init() {
//       delete Leaflet.Icon.Default.prototype._getIconUrl;
//       Leaflet.Icon.Default.mergeOptions({
//         iconRetinaUrl: 'leaflet/images/marker-icon-2x.png',
//         iconUrl: 'leaflet/images/marker-icon.png',
//         shadowUrl: 'leaflet/images/marker-shadow.png',
//       });
//     })();
//   }, []);

//   return (
//     <MapContainer className={mapClassName} {...rest}>
//       {children(ReactLeaflet, Leaflet)}
//     </MapContainer>
//   )
// }

// export default Map;
