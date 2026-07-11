import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, isLoggedIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [isLoggedIn, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await login(email, password);
    if (result.success) {
      router.replace("/dashboard");
    } else {
      setError(result.message);
    }
    setSubmitting(false);
  };

  if (loading || isLoggedIn) return null;

  return (
    <>
      <Head>
        <title>Login — GeoAgri</title>
      </Head>
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg)", fontFamily: "var(--font)",
      }}>
        <div style={{
          width: "100%", maxWidth: 380, padding: "0 20px",
        }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "linear-gradient(135deg, #155233, #1e7a52)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: "-.5px" }}>
              GeoAgri
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Masuk ke panel administrator
            </div>
          </div>

          <div style={{
            background: "var(--bg-white)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "28px 24px",
            boxShadow: "var(--shadow-sm)",
          }}>
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: "var(--radius-sm)",
                background: "var(--red-10)", border: "1px solid rgba(220,38,38,.2)",
                color: "var(--red)", fontSize: 12, marginBottom: 16, fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email"
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)",
                    color: "var(--text)", background: "var(--bg)",
                    outline: "none", transition: "border-color .15s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Masukkan password"
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)", fontSize: 13, fontFamily: "var(--font)",
                    color: "var(--text)", background: "var(--bg)",
                    outline: "none", transition: "border-color .15s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%", padding: "10px 0", borderRadius: "var(--radius-sm)",
                  background: "var(--primary)", color: "#fff", border: "none",
                  fontSize: 13, fontWeight: 600, fontFamily: "var(--font)",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1, transition: "opacity .15s",
                }}
              >
                {submitting ? "Masuk..." : "Masuk"}
              </button>
            </form>
          </div>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <a href="/dashboard" style={{
              fontSize: 12, color: "var(--text-muted)", fontWeight: 500,
              textDecoration: "none",
            }}>
              ← Kembali ke Dashboard
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
