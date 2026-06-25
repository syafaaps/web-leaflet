export default function StatCard({ label, value, sub, color = "#2d3bde", children }) {
  return (
    <div style={{
      background: "var(--bg-white)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: "20px 22px",
      boxShadow: "var(--shadow-sm)", position: "relative", overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: color, borderRadius: "2px 2px 0 0"
      }} />
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".8px", color: "var(--text-muted)", marginBottom: 12 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-1.5px", color: "var(--text)", lineHeight: 1, fontFamily: "var(--mono)" }}>
        {value ?? "—"}
      </div>
      {sub && (
        <div style={{ marginTop: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 5, color: "var(--text-muted)" }}>
          {sub}
        </div>
      )}
      {children}
    </div>
  );
}
