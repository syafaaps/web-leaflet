export default function Badge({ type = "valid", children }) {
  const colors = {
    valid: { bg: "var(--green-10)", color: "var(--green)" },
    null: { bg: "var(--orange-10)", color: "var(--orange)" },
    error: { bg: "var(--red-10)", color: "var(--red)" },
  };
  const c = colors[type] || colors.valid;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 8px",
      borderRadius: 20, fontSize: 11, fontWeight: 600,
      fontFamily: "var(--mono)", letterSpacing: ".3px",
      background: c.bg, color: c.color
    }}>
      {children}
    </span>
  );
}
