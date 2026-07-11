import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@contexts/AuthContext";

export default function AdminGuard({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/login");
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--text-muted)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 32, height: 32, border: "2px solid var(--border)",
            borderTopColor: "var(--primary)", borderRadius: "50%",
            animation: "geoSpin .6s linear infinite", margin: "0 auto 12px"
          }} />
          <div style={{ fontSize: 13 }}>Memuat...</div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return children;
}
