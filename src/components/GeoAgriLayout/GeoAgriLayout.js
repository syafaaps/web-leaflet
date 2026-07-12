import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@contexts/AuthContext";
import styles from "./GeoAgriLayout.module.css";

const guestNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" },
  { href: "/analisis-harga", label: "Analisis Harga", icon: "M22 12l-4 0-3 9-6-18-3 9-4 0" },
  { href: "/peta-pasar", label: "Peta Harga", icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" },
  { href: "/data", label: "Data Harga", icon: "M16 2H8l-2 4v14a2 2 0 002 2h8a2 2 0 002-2V6l-2-4zM10 2v4h4V2M8 13h8M8 17h8" },
  { href: "/peta-komoditas", label: "Peta Komoditas", icon: "M11 3h8l4 4v10a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2h4" },
];

const adminNavItems = [
  { href: "/admin/monitoring", label: "Monitoring Pipeline", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  { divider: true, label: "Data Master" },
  { href: "/admin/master/provinsi", label: "Provinsi", icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" },
  { href: "/admin/master/kabkota", label: "Kabupaten/Kota", icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" },
  { href: "/admin/master/pasar", label: "Pasar", icon: "M3 3h18v6H3zM6 9v12M18 9v12M9 21h6" },
  { href: "/admin/master/komoditas", label: "Komoditas", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
];

export default function GeoAgriLayout({ title, children, hideSidebar }) {
  const router = useRouter();
  const { user, isAdmin, isLoggedIn, logout } = useAuth();

  if (hideSidebar) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <aside className={styles.sidebar}>
        <div style={{
          background: "linear-gradient(135deg, #155233, #1e7a52)",
          padding: "20px 20px 16px", borderBottom: "1px solid var(--sidebar-border)",
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-.4px", lineHeight: 1.2 }}>GeoAgri</div>
          <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,.6)", marginTop: 2 }}>
            {isAdmin ? "Administrator" : "Analytic Curator"}
          </div>
        </div>

        <nav className={styles.nav}>
          {guestNavItems.map((item) => {
            const active = router.pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`${styles.navItem} ${active ? styles.active : ""}`}>
                <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}

          {isAdmin && adminNavItems.map((item, idx) => {
            if (item.divider) {
              return (
                <div key={`div-${idx}`} style={{
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "1px", color: "var(--text-light)", padding: "16px 12px 6px",
                  borderTop: "1px solid var(--border)", marginTop: 8,
                }}>
                  {item.label}
                </div>
              );
            }
            const active = router.pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`${styles.navItem} ${active ? styles.active : ""}`}>
                <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className={styles.navItem}>
                <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
                </svg>
                Bantuan
              </Link>
              <button onClick={handleLogout} className={styles.navItem} style={{ width: "100%", cursor: "pointer", background: "none", border: "none", textAlign: "left", fontFamily: "inherit" }}>
                <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Keluar
              </button>
            </>
          ) : (
            <Link href="/login" className={styles.navItem}>
              <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              Login
            </Link>
          )}
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header className={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={styles.headerTitle}>{title || "GeoAgri"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isLoggedIn && (
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
                {user?.name}
              </span>
            )}
            <div className={styles.avatar}>
              {user?.name?.charAt(0)?.toUpperCase() || "G"}
            </div>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
