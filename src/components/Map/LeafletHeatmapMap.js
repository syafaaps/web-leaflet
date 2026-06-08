// components/Map/LeafletHeatmapMap.js
// Choropleth per kabupaten/kota berdasarkan rata_kabupaten
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import styles from './Map.module.scss';

// ── Hitung range harga untuk pewarnaan ──────────────────────────────────────
function computeRange(features) {
  if (!features?.length) return { min: 0, max: 1 };
  const prices = features
    .map(f => Number(f.properties.rata_kabupaten))
    .filter(v => !isNaN(v) && v > 0);
  if (!prices.length) return { min: 0, max: 1 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

// ── Interpolasi warna hijau → kuning → merah ─────────────────────────────────
function priceToColor(value, min, max) {
  if (!value || max === min) return '#94a3b8';
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));

  // Palet: hijau (0) → kuning (0.5) → merah (1)
  let r, g, b;
  if (ratio < 0.5) {
    // hijau → kuning
    const t = ratio / 0.5;
    r = Math.round(34 + t * (251 - 34));   // 34 → 251
    g = Math.round(197 + t * (191 - 197)); // 197 → 191
    b = Math.round(94 + t * (36 - 94));    // 94 → 36
  } else {
    // kuning → merah
    const t = (ratio - 0.5) / 0.5;
    r = Math.round(251 + t * (239 - 251)); // 251 → 239
    g = Math.round(191 + t * (68 - 191));  // 191 → 68
    b = Math.round(36 + t * (68 - 36));    // 36 → 68
  }
  return `rgb(${r},${g},${b})`;
}

function priceToCategory(value, min, max) {
  if (!value || max === min) return { label: 'Tidak ada data', color: '#94a3b8' };
  const ratio = (value - min) / (max - min);
  if (ratio < 0.33) return { label: 'Murah', color: '#22c55e' };
  if (ratio < 0.66) return { label: 'Sedang', color: '#f97316' };
  return { label: 'Mahal', color: '#ef4444' };
}

// ── Layer choropleth ─────────────────────────────────────────────────────────
function ChoroplethLayer({ geojsonData, onHover, onClick }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.remove();
      layerRef.current = null;
    }

    if (!geojsonData?.features?.length) return;

    const { min, max } = computeRange(geojsonData.features);

    const layer = L.geoJSON(geojsonData, {
      style: (feature) => {
        const val = Number(feature.properties.rata_kabupaten);
        const color = priceToColor(val, min, max);
        return {
          fillColor: color,
          fillOpacity: 0.78,
          color: '#ffffff',
          weight: 1.2,
          opacity: 1,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const props = feature.properties;
        const val = Number(props.rata_kabupaten);
        const { label } = priceToCategory(val, min, max);

        featureLayer.on({
          mouseover: (e) => {
            e.target.setStyle({ fillOpacity: 0.95, weight: 2.5, color: '#fff' });
            onHover?.(props);
          },
          mouseout: (e) => {
            layer.resetStyle(e.target);
            onHover?.(null);
          },
          click: (e) => {
            onClick?.(props, e.latlng);
          },
        });

        // Tooltip ringan saat hover
        featureLayer.bindTooltip(
          `<div style="
            font-family:'DM Sans',system-ui,sans-serif;
            font-size:12px;line-height:1.4;
          ">
            <strong>${props.kabupaten}</strong><br/>
            ${props.komoditas_nama || ''}<br/>
            <span style="color:#0f4c35;font-weight:700;">
              Rp ${val ? val.toLocaleString('id-ID') : '–'}
            </span>
            <span style="
              margin-left:6px;padding:1px 6px;border-radius:9px;font-size:10px;
              background:${priceToCategory(val, min, max).color}22;
              color:${priceToCategory(val, min, max).color};font-weight:600;
            ">${label}</span>
          </div>`,
          { sticky: true, offset: [12, 0], opacity: 0.97 }
        );
      },
    });

    layer.addTo(map);
    layerRef.current = layer;

    // Fit map ke bounds layer
    if (layer.getBounds().isValid()) {
      map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    }

    return () => {
      if (layerRef.current) {
        layerRef.current.remove();
      }
    };
  }, [geojsonData, map]);

  return null;
}

// ── Komponen utama ────────────────────────────────────────────────────────────
const LeafletHeatmapMap = ({
  className,
  geojsonData,
  onHover,
  onClick,
}) => {
  const mapClassName = [styles.map, className].filter(Boolean).join(' ');

  return (
    <MapContainer
      className={mapClassName}
      center={[-7.5, 112.0]}
      zoom={8}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      {/* CartoDB Positron - bersih, cocok untuk choropleth */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />

      {/* Label jalan/kota tetap terlihat di atas layer */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
        attribution=''
        pane="shadowPane"
      />

      <ChoroplethLayer
        geojsonData={geojsonData}
        onHover={onHover}
        onClick={onClick}
      />
    </MapContainer>
  );
};

export default LeafletHeatmapMap;