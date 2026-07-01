import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './Map.module.scss';

// ── Konfigurasi warna per kategori ──────────────────────────────────────────
const KATEGORI_CONFIG = {
  'Di Atas Rata-rata': {
    fill: '#ef4444',
    stroke: '#b91c1c',
    glow: 'rgba(239,68,68,0.4)',
    emoji: '🔴'
  },

  'Rata-rata': {
    fill: '#f97316',
    stroke: '#c2410c',
    glow: 'rgba(249,115,22,0.4)',
    emoji: '🟠'
  },

  'Di Bawah Rata-rata': {
    fill: '#22c55e',
    stroke: '#15803d',
    glow: 'rgba(34,197,94,0.4)',
    emoji: '🟢'
  },
};

function getConfig(kategori) {
  return KATEGORI_CONFIG[kategori] ?? KATEGORI_CONFIG['Rata-rata'];
}

// ── SVG teardrop pin — runcing bawah, dot putih di tengah ───────────────────
function createPinIcon(kategori, active = false) {
  const { fill, stroke, glow } = getConfig(kategori);

  const size = active ? 40 : 30;
  const height = active ? 50 : 38;

  const svg = `
  <svg
  xmlns="http://www.w3.org/2000/svg"
  width="30"
  height="38"
  viewBox="0 0 30 38">

    <defs>
      <filter id="glow-${kategori}">
        <feDropShadow
          dx="0"
          dy="2"
          stdDeviation="${active ? 7 : 3}"
          flood-color="${glow}"
          flood-opacity="1"/>
      </filter>
    </defs>

    <path
      d="M15 2C8.373 2 3 7.373 3 14C3 22 15 36 15 36C15 36 27 22 27 14C27 7.373 21.627 2 15 2Z"
      fill="${fill}"
      stroke="${stroke}"
      stroke-width="${active ? 2.4 : 1.5}"
      filter="url(#glow-${kategori})"
    />

    <circle cx="15" cy="13.5"
            r="${active ? 7 : 6}"
            fill="white"/>

    <circle cx="15" cy="13.5"
            r="${active ? 3.5 : 2.8}"
            fill="${stroke}"/>

  </svg>`;

const scale = active ? 1.3 : 1;

return L.divIcon({
  html: `
    <div
      style="
        transform: scale(${scale});
        transform-origin: center bottom;
        transition: transform .18s ease;
      "
    >
      ${svg}
    </div>
  `,
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

function buildPopupHTML(item) {
  const harga = fmtHarga(item.harga);
  const sub = [item.kabupaten, item.provinsi].filter(Boolean).join(', ');
  const records = item.total_records || item.total_data || 0;
  
  const rata = item.rata_prov ? `Rp ${Number(item.rata_prov).toLocaleString('id-ID')}` : '-';
  const pct = Number(item.persen_deviasi ?? 0);
  const pctStr = `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`;
  
  let pctColor = '#f97316';
  if (item.kategori === 'Di Atas Rata-rata') pctColor = '#ef4444';
  if (item.kategori === 'Di Bawah Rata-rata') pctColor = '#22c55e';
  
  const tgl = item.tanggal
    ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

  const { fill, stroke, emoji } = getConfig(item.kategori);
  return `
    <div style="font-family:'DM Sans',system-ui,sans-serif;min-width:210px;max-width:250px;">
      <div style="background:${fill};padding:10px 13px 8px;border-radius:9px 9px 0 0;">
        <div style="font-weight:800;font-size:13px;color:white;margin-bottom:2px;line-height:1.3;">${item.nama_pasar}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.85);margin-bottom:6px;">📍 ${item.kabupaten}, Jawa Timur</div>
        <a href="https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}" 
           target="_blank" 
           rel="noopener noreferrer" 
           style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.4);border-radius:6px;font-size:10.5px;font-weight:700;text-decoration:none;transition:background 0.2s;"
           onmouseover="this.style.background='rgba(255,255,255,0.3)'"
           onmouseout="this.style.background='rgba(255,255,255,0.2)'"
        >
          🗺️ Petunjuk Arah
        </a>
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
        <div class="popup-weather" style="margin-top:8px;padding:8px 11px;background:#f9fafb;border-radius:6px;font-size:11.5px;display:flex;align-items:center;gap:8px;">
          <span class="weather-loading" style="color:#9ca3af;">⏳ Memuat cuaca...</span>
        </div>
      </div>
    </div>`;
}

// ── Layer marker, diperbarui setiap pasarData berubah ───────────────────────
    function PasarMarkerLayer({
      pasarData,
      selectedPasar,
      selectedKabupaten,
      onMarkerClick
    }) {

      const map = useMap();

      const layerRef = useRef(null);

      const selectedMarkerRef = useRef(null);
      const prevKabRef = useRef(selectedKabupaten);

      useEffect(() => {
        if (prevKabRef.current !== selectedKabupaten) {
          prevKabRef.current = selectedKabupaten;
          if (selectedKabupaten && pasarData && pasarData.length > 0) {
            const coords = pasarData
              .map(item => [Number(item.latitude), Number(item.longitude)])
              .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));
            if (coords.length > 0) {
              const bounds = L.latLngBounds(coords);
              map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
            }
          } else if (!selectedKabupaten) {
            map.setView([-7.5, 112.5], 8);
          }
        }
      }, [selectedKabupaten, pasarData, map]);

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    } else {
      layerRef.current.clearLayers();
    }
    if (!pasarData?.length) return;

    pasarData.forEach((item) => {

    if (
      item.harga == null ||
      Number(item.harga) <= 0
    ) {
      return;
    }

    const lat = Number(item.latitude);
    const lng = Number(item.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

    const marker = L.marker([lat, lng], {
    icon: createPinIcon(item.kategori, selectedPasar?.uid === item.uid)
  });
  marker.kategori = item.kategori;

  marker.bindTooltip(item.nama_pasar, {
    direction: 'top',
    offset: [0, -28],
    opacity: 0.95,
    sticky: true
  });

marker.on("click", () => {

  if (selectedMarkerRef.current) {

    selectedMarkerRef.current.setIcon(
      createPinIcon(
        selectedMarkerRef.current.kategori,
        false
      )
    );

    selectedMarkerRef.current.setZIndexOffset(0);
  }

  marker.setIcon(
    createPinIcon(item.kategori, true)
  );

  marker.setZIndexOffset(1000);

  selectedMarkerRef.current = marker;

  if (onMarkerClick) {
    onMarkerClick(item);
  }

});

  marker
    .bindPopup(buildPopupHTML(item), {
      maxWidth: 270,
      className: 'pasar-popup',
    })
    .on('popupopen', () => {
      const popupEl = marker.getPopup()?.getElement();
      if (!popupEl) return;
      const weatherEl = popupEl.querySelector('.popup-weather');
      if (!weatherEl || weatherEl.dataset.loaded) return;
      weatherEl.dataset.loaded = '1';
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`)
        .then(r => r.json())
        .then(data => {
          const cw = data.current_weather;
          if (!cw) {
            weatherEl.innerHTML = '<span class="weather-loading">Cuaca tidak tersedia</span>';
            return;
          }
          weatherEl.innerHTML = `
            <span class="weather-icon">${getWeatherIcon(cw.weathercode)}</span>
            <span class="weather-temp">${cw.temperature}°C</span>
            <span class="weather-desc">${getWeatherDesc(cw.weathercode)}</span>
          `;
        })
        .catch(() => {
          weatherEl.innerHTML = '<span class="weather-loading">Gagal memuat cuaca</span>';
        });
    })
    .addTo(layerRef.current);
    });
  }, [pasarData, map, onMarkerClick]);

  return null;
}

// ── Komponen utama ───────────────────────────────────────────────────────────
  const LeafletMapDynamic = ({
    className,
    pasarData = [],
    selectedPasar,
    selectedKabupaten,
    onMarkerClick
  }) => {
  const mapClassName = [styles.map, className].filter(Boolean).join(' ');

  return (
    <>
      <style>{`
        .pasar-popup .leaflet-popup-content-wrapper {
          border-radius: var(--radius-sm, 6px) !important;
          border: 1px solid var(--border, #e5e7eb) !important;
          box-shadow: var(--shadow, 0 4px 16px rgba(0,0,0,.12)) !important;
          font-family: var(--font), sans-serif !important;
          overflow: hidden;
        }
        .pasar-popup .leaflet-popup-content { margin: 10px 14px; width: auto !important; }
        .pasar-popup .leaflet-popup-tip { box-shadow: var(--shadow, 0 2px 8px rgba(0,0,0,.12)) !important; }
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
        selectedPasar={selectedPasar}
        selectedKabupaten={selectedKabupaten}
          onMarkerClick={onMarkerClick}
        />
      </MapContainer>
    </>
  );
};

export default LeafletMapDynamic;
