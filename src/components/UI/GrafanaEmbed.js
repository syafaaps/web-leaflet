import { useEffect, useRef } from "react";

const RANGE_MAP = {7:"now-7d",30:"now-30d",90:"now-90d"};

export default function GrafanaEmbed({ panelId, height = 260, komoditasIds = [], provinsiId = "", provinsiIds = [], range = 30, tab = "" }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;

    const base = `${process.env.NEXT_PUBLIC_GRAFANA_URL}/d-solo/adqfddx/dashboard-geoagri`;
    const params = new URLSearchParams({
      orgId: 1, from: RANGE_MAP[range] || "now-30d", to: "now",
      timezone: "browser", theme: "light", kiosk: "",
      panelId,
    });
    if (tab) params.set("dtab", tab);
    komoditasIds.forEach(id => params.append("var-komoditas", id));
    if (provinsiIds.length) {
      provinsiIds.forEach(id => params.append("var-provinsi", id));
    } else if (provinsiId) {
      params.set("var-provinsi", provinsiId);
    }

    el.src = `${base}?${params}`;
  }, [panelId, komoditasIds, provinsiId, provinsiIds, range, tab]);

  return (
    <iframe ref={iframeRef}
      width="100%" height={height} frameBorder="0" title={`Grafana ${panelId}`}
      style={{ borderRadius: "var(--radius-sm)", background: "#fff", display: "block" }}
      allow="cross-origin-isolated"
    />
  );
}
