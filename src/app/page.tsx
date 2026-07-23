"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Player {
  id: string;
  name: string;
  club: string;
  position: string;
  age: number;
  nationality: string;
  contract_end: string;
  market_value: string;
  payment_status: "paid" | "pending" | "overdue";
  payment_amount: string;
  verified: boolean;
  photo: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    paid: { backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" },
    pending: { backgroundColor: "rgba(201,162,39,0.12)", color: "#c9a227", border: "1px solid rgba(201,162,39,0.2)" },
    overdue: { backgroundColor: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" },
  };

  const labels = { paid: "PAID", pending: "PENDING", overdue: "OVERDUE" };

  return (
    <span
      style={{
        ...styles[status],
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: 600,
      }}
    >
      {labels[status as keyof typeof labels]}
    </span>
  );
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    setLoading(true);
    const { data, error } = await supabase.from("players").select("*");
    if (error) {
      console.error("Error fetching players:", error);
    } else {
      setPlayers(data || []);
    }
    setLoading(false);
  }

  const positions = ["All", ...new Set(players.map((p) => p.position.split("(")[0]))];

  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.club.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition =
      positionFilter === "All" || player.position.includes(positionFilter);
    return matchesSearch && matchesPosition;
  });

  const totalPending = players
    .filter((p) => p.payment_status === "pending")
    .reduce((sum, p) => sum + parseInt(p.payment_amount.replace(/[^0-9]/g, "") || "0"), 0);
  const totalOverdue = players.filter((p) => p.payment_status === "overdue").length;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#e8e8e8" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0f", color: "#e8e8e8", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(180deg, #0f111a 0%, #0a0a0f 100%)", borderBottom: "1px solid #1a1d2e" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "42px", height: "42px", background: "linear-gradient(135deg, #c9a227 0%, #f0d878 100%)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "18px", color: "#0a0a0f" }}>
              11
            </div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "1px", color: "#f5f5f5" }}>11WINS</div>
              <div style={{ fontSize: "11px", color: "#6b6f8a", letterSpacing: "2px", textTransform: "uppercase" }}>Player Agency</div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: "28px", alignItems: "center" }}>
            <a href="/" style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.5px", color: "#c9a227", textDecoration: "none", borderBottom: "2px solid #c9a227", paddingBottom: "4px" }}>ROSTER</a>
            <a href="/admin" style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.5px", color: "#6b6f8a", textDecoration: "none", paddingBottom: "4px" }}>ADMIN</a>
          </nav>
        </div>
      </header>

      {/* Stats Bar */}
      <div style={{ backgroundColor: "#0f111a", borderBottom: "1px solid #1a1d2e" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "16px 32px", display: "flex", gap: "40px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", backgroundColor: "#22c55e", borderRadius: "50%" }}></span>
            <span style={{ fontSize: "12px", color: "#6b6f8a" }}>Active Players</span>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#f5f5f5" }}>{players.length}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", backgroundColor: "#c9a227", borderRadius: "50%" }}></span>
            <span style={{ fontSize: "12px", color: "#6b6f8a" }}>Pending Payments</span>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#f5f5f5" }}>€{(totalPending / 1000).toFixed(1)}M</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", backgroundColor: "#ef4444", borderRadius: "50%" }}></span>
            <span style={{ fontSize: "12px", color: "#6b6f8a" }}>Overdue</span>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#f5f5f5" }}>{totalOverdue}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 32px", display: "flex", gap: "12px", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ backgroundColor: "#141622", border: "1px solid #1a1d2e", borderRadius: "8px", padding: "10px 16px", color: "#e8e8e8", fontSize: "13px", width: "240px", outline: "none" }}
        />
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          style={{ backgroundColor: "#141622", border: "1px solid #1a1d2e", borderRadius: "8px", padding: "10px 14px", color: "#e8e8e8", fontSize: "13px", outline: "none", cursor: "pointer" }}
        >
          {positions.map((pos) => (
            <option key={pos} value={pos} style={{ backgroundColor: "#141622" }}>
              {pos === "All" ? "All Positions" : pos}
            </option>
          ))}
        </select>
        <a href="/admin" style={{ marginLeft: "auto", backgroundColor: "#c9a227", color: "#0a0a0f", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
          + Add Player
        </a>
      </div>

      {/* Player Grid */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 32px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "16px" }}>
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              style={{
                background: "linear-gradient(145deg, #141622 0%, #0f111a 100%)",
                border: "1px solid #1a1d2e",
                borderRadius: "14px",
                padding: "20px",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(201,162,39,0.2)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1a1d2e";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ position: "absolute", top: 0, right: 0, width: "80px", height: "80px", background: "radial-gradient(circle at top right, rgba(201,162,39,0.08) 0%, transparent 70%)" }}></div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", position: "relative", zIndex: 1 }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "12px", overflow: "hidden", flexShrink: 0, backgroundColor: "#1a1d2e" }}>
                  {player.photo ? (
                    <img src={player.photo} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>👤</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#f5f5f5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {player.name}
                    </span>
                    {player.verified && (
                      <span style={{ flexShrink: 0, backgroundColor: "rgba(201,162,39,0.08)", color: "#c9a227", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", border: "1px solid rgba(201,162,39,0.18)" }}>
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "13px", color: "#6b6f8a", marginBottom: "12px" }}>
                    {player.club} · {player.position} · {player.age} yrs · {player.nationality}
                  </div>
                  <div style={{ display: "flex", gap: "20px" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#4a4d5e", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>Contract</div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#e8e8e8" }}>{player.contract_end}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#4a4d5e", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>Market Value</div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#22c55e" }}>{player.market_value}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#4a4d5e", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>Payment</div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#f5f5f5" }}>
                        {player.payment_amount} <StatusBadge status={player.payment_status} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #1a1d2e", padding: "20px 32px", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "#4a4d5e" }}>© 2026 11WINS GmbH. All rights reserved. Munich, Germany.</p>
      </footer>
    </div>
  );
}