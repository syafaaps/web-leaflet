export default function FilterBar({ children }) {
  return (
    <div style={{
      background: "var(--bg-white)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: "14px 20px",
      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      marginBottom: 20, boxShadow: "var(--shadow-sm)"
    }}>
      {children}
    </div>
  );
}
