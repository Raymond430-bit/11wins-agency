"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password === "11wins2026") {
      localStorage.setItem("admin_auth", "true");
      router.push("/admin");
    } else {
      setError("Invalid password");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ backgroundColor: "#141622", border: "1px solid #1a1d2e", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #c9a227 0%, #f0d878 100%)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "20px", color: "#0a0a0f", margin: "0 auto 16px" }}>
            11
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#f5f5f5", margin: 0 }}>Admin Access</h1>
          <p style={{ fontSize: "13px", color: "#6b6f8a", margin: "8px 0 0" }}>Enter password to access dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", backgroundColor: "#0f111a", border: "1px solid #1a1d2e", borderRadius: "8px", padding: "12px 14px", color: "#e8e8e8", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          {error && (
            <div style={{ color: "#ef4444", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", backgroundColor: "#c9a227", color: "#0a0a0f", border: "none", borderRadius: "8px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
          >
            {loading ? "Checking..." : "Login"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <a href="/" style={{ fontSize: "13px", color: "#6b6f8a", textDecoration: "none" }}>← Back to Roster</a>
        </div>
      </div>
    </div>
  );
}