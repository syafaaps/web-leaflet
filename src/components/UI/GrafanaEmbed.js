import { useEffect, useRef, useState } from "react";

const RANGE_MAP = {7:"now-7d",30:"now-30d",90:"now-90d"};

export default function GrafanaEmbed({ panelId, height = 260, komoditasIds = [], provinsiId = "", provinsiIds = [], range = 30, tab = "" }) {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !iframeRef.current) return;

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

    iframeRef.current.src = `${base}?${params}`;
  }, [visible, panelId, komoditasIds, provinsiId, provinsiIds, range, tab]);

  return (
    <div ref={containerRef} style={{ minHeight: height }}>
      {visible ? (
        <iframe ref={iframeRef}
          width="100%" height={height} frameBorder="0" title={`Grafana ${panelId}`}
          style={{ borderRadius: "var(--radius-sm)", background: "#fff", display: "block" }}
          allow="cross-origin-isolated"
        />
      ) : (
        <div style={{ height, borderRadius: "var(--radius-sm)", background: "var(--bg-muted, #f3f4f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
          Memuat panel Grafana...
        </div>
      )}
    </div>
  );
}
