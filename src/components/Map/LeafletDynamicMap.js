import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './Map.module.scss';

function getPriceColor(harga, min, max) {
  if (!harga || max <= min) return '#e5e7eb';
  const ratio = (harga - min) / (max - min);
  if (ratio < 0.25) return '#86efac';
  if (ratio < 0.50) return '#fde68a';
  if (ratio < 0.75) return '#fca5a5';
  return '#ef4444';
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function createPinIcon(hexColor) {
  const { r, g, b } = hexToRgb(hexColor);
  const glow = `rgba(${r},${g},${b},0.4)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
    <defs>
      <filter id="g" x="-50%" y="-30%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${glow}" flood-opacity="1"/>
      </filter>
    </defs>
    <path d="M15 2C8.373 2 3 7.373 3 14C3 22 15 36 15 36C15 36 27 22 27 14C27 7.373 21.627 2 15 2Z"
      fill="${hexColor}" stroke="${hexColor}" stroke-width="1.5" filter="url(#g)"/>
    <circle cx="15" cy="13.5" r="6" fill="white" opacity="0.92"/>
    <circle cx="15" cy="13.5" r="2.8" fill="${hexColor}"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [30, 38],
    iconAnchor: [15, 36],
    popupAnchor: [0, -38],
  });
}

const fmtHarga = (n) => n ? 'Rp ' + Number(n).toLocaleString('id-ID') : '—';

function getWeatherIcon(code) {
  if (code === 0) return '\u2600\uFE0F';
  if (code <= 2) return '\u26C5';
  if (code === 3 || code >= 45) return '\u2601\uFE0F';
  if (code >= 51 && code <= 55) return '\uD83C\uDF26\uFE0F';
  if (code >= 61 && code <= 65) return '\uD83C\uDF27\uFE0F';
  if (code >= 71 && code <= 75) return '\u2744\uFE0F';
  if (code >= 80 && code <= 82) return '\uD83C\uDF27\uFE0F';
  if (code >= 95) return '\u26C8\uFE0F';
  return '\uD83C\uDF24\uFE0F';
}

function getWeatherDesc(code) {
  const m = {
    0: 'Cerah', 1: 'Cerah berawan', 2: 'Berawan', 3: 'Mendung',
    45: 'Berkabut', 48: 'Kabut beku',
    51: 'Gerimis ringan', 53: 'Gerimis', 55: 'Gerimis deras',
    56: 'Gerimis beku ringan', 57: 'Gerimis beku',
    61: 'Hujan ringan', 63: 'Hujan', 65: 'Hujan deras',
    66: 'Hujan beku ringan', 67: 'Hujan beku',
    71: 'Salju ringan', 73: 'Salju', 75: 'Salju deras', 77: 'Butiran salju',
    80: 'Hujan ringan', 81: 'Hujan', 82: 'Hujan deras',
    85: 'Salju ringan', 86: 'Salju deras',
    95: 'Badai', 96: 'Badai', 99: 'Badai'
  };
  return m[code] || 'Tidak diketahui';
}

function buildPopupHTML(item, weatherId) {
  const harga = fmtHarga(item.harga);
  const sub = [item.kabupaten, item.provinsi].filter(Boolean).join(', ');
  const records = item.total_records || item.total_data || 0;
  return `
    <div class="map-popup">
      <div class="map-popup-name">${item.nama_pasar || item.nama || '—'}</div>
      ${sub ? `<div class="map-popup-sub">${sub}</div>` : ''}
      <hr class="map-popup-divider" />
      <div class="map-popup-price">${harga}</div>
      <div style="font-size:12px;color:#9ca3af;margin-top:2px">${records} record</div>
      <div class="popup-weather" id="${weatherId}">
        <span class="weather-loading">Memuat cuaca...</span>
      </div>
    </div>`;
}

function PasarMarkerLayer({ pasarData, onMarkerClick, hargaMin, hargaMax }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    } else {
      layerRef.current.clearLayers();
    }
    if (!pasarData?.length) return;

    const mn = hargaMin ?? Math.min(...pasarData.map(p => Number(p.harga)).filter(v => !isNaN(v)), 0);
    const mx = hargaMax ?? Math.max(...pasarData.map(p => Number(p.harga)).filter(v => !isNaN(v)), 1);

    pasarData.forEach((item, idx) => {
      const lat = Number(item.latitude);
      const lng = Number(item.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const h = Number(item.harga);
      const color = h && mx > mn ? getPriceColor(h, mn, mx) : '#e5e7eb';
      const weatherId = 'w-' + (item.pasar_id || item.id || idx);

      L.marker([lat, lng], { icon: createPinIcon(color) })
        .on('click', () => { if (onMarkerClick) onMarkerClick(item); })
        .bindPopup(buildPopupHTML(item, weatherId), {
          maxWidth: 260,
          className: 'pasar-popup',
        })
        .on('popupopen', () => {
          const el = document.getElementById(weatherId);
          if (!el || el.dataset.loaded) return;
          el.dataset.loaded = 'true';
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`)
            .then(r => r.json())
            .then(d => {
              const t = d.current.temperature_2m;
              const c = d.current.weather_code;
              el.innerHTML = `<span class="weather-icon">${getWeatherIcon(c)}</span><span class="weather-temp">${Math.round(t)}°C</span><span class="weather-desc">${getWeatherDesc(c)}</span>`;
            })
            .catch(() => { el.innerHTML = '<span style="color:#9ca3af">Cuaca tidak tersedia</span>'; });
        })
        .addTo(layerRef.current);
    });
  }, [pasarData, map, onMarkerClick, hargaMin, hargaMax]);

  return null;
}

const LeafletMapDynamic = ({
  className,
  pasarData = [],
  onMarkerClick,
  hargaMin,
  hargaMax,
}) => {
  const mapClassName = [styles.map, className].filter(Boolean).join(' ');

  return (
    <>
      <style>{`
        .pasar-popup .leaflet-popup-content-wrapper { padding: 0; border-radius: 0; box-shadow: 0 2px 12px rgba(0,0,0,.12); }
        .pasar-popup .leaflet-popup-content { margin: 10px 14px; width: auto !important; }
        .pasar-popup .leaflet-popup-tip { box-shadow: 0 2px 8px rgba(0,0,0,.12); }
      `}</style>
      <MapContainer
        className={mapClassName}
        center={[-7.5, 112.5]}
        zoom={8}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        <PasarMarkerLayer
          pasarData={pasarData}
          onMarkerClick={onMarkerClick}
          hargaMin={hargaMin}
          hargaMax={hargaMax}
        />
      </MapContainer>
    </>
  );
};

export default LeafletMapDynamic;
