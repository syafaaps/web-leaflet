import { useRouter } from "next/router";
import Link from "next/link";
import styles from "./GeoAgriLayout.module.css";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" },
  { href: "/analisis-harga", label: "Analisis Harga", icon: "M22 12l-4 0-3 9-6-18-3 9-4 0" },
  { href: "/analisis-null", label: "Analisis NULL", icon: "M18 20V10M12 20V4M6 20v-6" },
  { href: "/analisis-pasar", label: "Analisis Pasar", icon: "M3 3h18v6H3zM6 9v12M18 9v12M9 21h6" },
  { href: "/peta-pasar", label: "Peta Pasar", icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" },
  { href: "/peta-komoditas", label: "Peta Komoditas", icon: "M11 3h8l4 4v10a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2h4" },
  // { href: "/data", label: "Data", icon: "M3 9h18M3 15h18M9 3v18M15 3v18" },
  { href: "/scraping-log", label: "Log Scraping", icon: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM12 6v6l4 2" },
];

export default function GeoAgriLayout({ title, children, hideSidebar }) {
  const router = useRouter();

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <aside className={styles.sidebar}>
        <div style={{
          background: "linear-gradient(135deg, #155233, #1e7a52)",
          padding: "20px 20px 16px", borderBottom: "1px solid var(--sidebar-border)",
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-.4px", lineHeight: 1.2 }}>GeoAgri</div>
          <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,.6)", marginTop: 2 }}>Analytic Curator</div>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const active = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.active : ""}`}
              >
                <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.footer}>
          <Link href="#" className={styles.navItem}>
            <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
            Bantuan
          </Link>
          <Link href="#" className={styles.navItem}>
            <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Keluar
          </Link>
        </div>
      </aside>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header className={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={styles.headerTitle}>{title || "GeoAgri"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className={styles.iconBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>
            <button className={styles.iconBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
            <div className={styles.avatar}>A</div>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
