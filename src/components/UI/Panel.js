export default function Panel({ title, subtitle, actions, children, style }) {
  return (
    <div style={{
      background: "var(--bg-white)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)",
      overflow: "hidden", ...style
    }}>
      {title && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px 0"
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", letterSpacing: "-.2px" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{subtitle}</div>}
          </div>
          {actions}
        </div>
      )}
      <div style={{ padding: title ? "16px 20px 20px" : 20 }}>
        {children}
      </div>
    </div>
  );
}
