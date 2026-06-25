import { useEffect, useRef } from "react";

export default function PasarMap({ pasars = [], mapId = "analisisPasarMap", center = [-2.5, 118], zoom = 5 }) {
  const mapRef = useRef(null);
  const markersRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const L = require("leaflet");
    if (!mapRef.current) {
      mapRef.current = L.map(mapId, { zoomControl: true }).setView(center, zoom);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap, © CartoDB",
        subdomains: "abcd", maxZoom: 19,
      }).addTo(mapRef.current);
    }
    return () => {};
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    const L = require("leaflet");
    if (markersRef.current) { mapRef.current.removeLayer(markersRef.current); }

    const items = pasars.filter(p => p.latitude && p.longitude);
    if (!items.length) return;

    function getRadius(records) {
      if (!records) return 8;
      if (records > 500) return 16;
      if (records > 200) return 12;
      return 8;
    }

    function getColor(pct) {
      if (!pct || pct > 15) return "#dc2626";
      if (pct > 8) return "#ea580c";
      if (pct > 5) return "#d97706";
      return "#16a34a";
    }

    markersRef.current = L.layerGroup(
      items.map(item => {
        const pct = item.null_pct || 0;
        const color = getColor(pct);
        const html = `<div style="width:${getRadius(item.total_records)}px;height:${getRadius(item.total_records)}px;border-radius:50%;background:${color};opacity:.85;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.2)"></div>`;
        const icon = L.divIcon({ html, className: "", iconSize: [getRadius(item.total_records), getRadius(item.total_records)], iconAnchor: [getRadius(item.total_records) / 2, getRadius(item.total_records) / 2] });
        const marker = L.marker([parseFloat(item.latitude), parseFloat(item.longitude)], { icon });
        marker.bindPopup(`
          <div style="font-family:Sora,sans-serif;padding:4px">
            <div style="font-size:13px;font-weight:700;color:#111827">${item.nama}</div>
            <div style="font-size:11px;color:#6b7280;margin:2px 0">${item.provinsi || "—"}</div>
            <div style="font-size:13px;font-weight:700;font-family:DM Mono,monospace;color:#111827">${item.total_records || 0} records</div>
            <div style="font-size:11px;color:#9ca3af">NULL: ${item.null_records || 0} (${pct}%)</div>
          </div>
        `);
        return marker;
      })
    ).addTo(mapRef.current);
  }, [pasars]);

  useEffect(() => {
    if (!mapRef.current || !pasars.length) return;
    const L = require("leaflet");
    const items = pasars.filter(p => p.latitude && p.longitude);
    if (items.length) {
      const bounds = L.latLngBounds(items.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]));
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 7 });
    }
  }, [pasars]);

  return null;
}
