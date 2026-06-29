export default function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size, border: "2px solid var(--border)",
      borderTopColor: "var(--primary)", borderRadius: "50%",
      animation: "geoSpin .6s linear infinite",
      display: "inline-block"
    }} />
  );
}
