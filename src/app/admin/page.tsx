"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
        padding: "4px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 600,
      }}
    >
      {labels[status as keyof typeof labels]}
    </span>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    club: "",
    position: "",
    age: "",
    nationality: "",
    contract_end: "",
    market_value: "",
    payment_status: "pending" as "paid" | "pending" | "overdue",
    payment_amount: "",
    verified: false,
    photo: "",
  });

  // Check auth
  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth !== "true") {
      router.push("/admin/login");
    } else {
      setIsAuth(true);
    }
  }, [router]);

  // Fetch players when auth confirmed
  useEffect(() => {
    if (isAuth) {
      fetchPlayers();
    }
  }, [isAuth]);

  async function fetchPlayers() {
    setLoading(true);
    const { data, error } = await supabase.from("players").select("*");
    if (error) {
      console.error("Error fetching players:", error);
      alert("Failed to load players: " + error.message);
    } else {
      console.log("Fetched players:", data);
      setPlayers(data || []);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!id) {
      alert("Error: Player ID is missing");
      return;
    }
    if (!confirm("Are you sure you want to delete this player?")) return;
    
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) {
      alert("Failed to delete: " + error.message);
    } else {
      setPlayers(players.filter((p) => p.id !== id));
    }
  }

  function handleEdit(player: Player) {
    if (!player.id) {
      alert("Error: This player has no ID. Try refreshing the page.");
      return;
    }
    console.log("Editing player:", player);
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      club: player.club,
      position: player.position,
      age: player.age.toString(),
      nationality: player.nationality,
      contract_end: player.contract_end,
      market_value: player.market_value,
      payment_status: player.payment_status,
      payment_amount: player.payment_amount,
      verified: player.verified,
      photo: player.photo || "",
    });
    setShowModal(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
    
    console.log("File selected:", file.name, "Size:", file.size, "Type:", file.type);
    
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File must be less than 5MB");
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    console.log("Uploading as:", fileName);

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from("playerphotos")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    console.log("Upload result:", { uploadError, uploadData });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      alert("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("playerphotos")
      .getPublicUrl(fileName);

    console.log("URL data:", urlData);

    if (urlData?.publicUrl) {
      console.log("Setting photo URL:", urlData.publicUrl);
      setFormData(prev => ({ ...prev, photo: urlData.publicUrl }));
    } else {
      console.error("No publicUrl returned");
      alert("Failed to get image URL");
    }
    
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingPlayer && !editingPlayer.id) {
      alert("Error: Cannot update — player ID is missing");
      return;
    }

    const playerData = {
      name: formData.name,
      club: formData.club,
      position: formData.position,
      age: parseInt(formData.age),
      nationality: formData.nationality,
      contract_end: formData.contract_end,
      market_value: formData.market_value,
      payment_status: formData.payment_status,
      payment_amount: formData.payment_amount,
      verified: formData.verified,
      photo: formData.photo || null,
    };

    if (editingPlayer) {
      console.log("Updating player with ID:", editingPlayer.id);
      const { error } = await supabase.from("players").update(playerData).eq("id", editingPlayer.id);
      if (error) {
        alert("Failed to update: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("players").insert([playerData]);
      if (error) {
        alert("Failed to add: " + error.message);
        return;
      }
    }

    await fetchPlayers();
    setShowModal(false);
    setEditingPlayer(null);
    resetForm();
  }

  function resetForm() {
    setFormData({
      name: "",
      club: "",
      position: "",
      age: "",
      nationality: "",
      contract_end: "",
      market_value: "",
      payment_status: "pending",
      payment_amount: "",
      verified: false,
      photo: "",
    });
  }

  const totalPending = players
    .filter((p) => p.payment_status === "pending")
    .reduce((sum, p) => sum + parseInt(p.payment_amount.replace(/[^0-9]/g, "") || "0"), 0);
  const totalOverdue = players.filter((p) => p.payment_status === "overdue").length;

  if (!isAuth) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#e8e8e8" }}>
        Checking access...
      </div>
    );
  }

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
            <div style={{ width: "42px", height: "42px", background: "linear-gradient(135deg, #c9a227 0%, #f0d878 100%)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "18px", color: "#0a0a0f" }}>11</div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "1px", color: "#f5f5f5" }}>11WINS</div>
              <div style={{ fontSize: "11px", color: "#6b6f8a", letterSpacing: "2px", textTransform: "uppercase" }}>Player Agency</div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: "28px", alignItems: "center" }}>
            <a href="/" style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.5px", color: "#6b6f8a", textDecoration: "none", paddingBottom: "4px" }}>ROSTER</a>
            <a href="/admin" style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.5px", color: "#c9a227", textDecoration: "none", borderBottom: "2px solid #c9a227", paddingBottom: "4px" }}>ADMIN</a>
            <button
              onClick={() => {
                localStorage.removeItem("admin_auth");
                router.push("/");
              }}
              style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.5px", color: "#6b6f8a", background: "none", border: "none", cursor: "pointer", paddingBottom: "4px" }}
            >
              LOGOUT
            </button>
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

      {/* Admin Content */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f5f5f5", margin: 0 }}>Admin Dashboard</h1>
            <p style={{ fontSize: "13px", color: "#6b6f8a", margin: "4px 0 0" }}>Manage players, contracts, and payment status</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e", fontSize: "12px", fontWeight: 600, padding: "6px 14px", borderRadius: "20px" }}>● Online</span>
            <button onClick={() => { setEditingPlayer(null); resetForm(); setShowModal(true); }} style={{ backgroundColor: "#c9a227", color: "#0a0a0f", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>+ Add Player</button>
          </div>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: "#141622", border: "1px solid #1a1d2e", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#0f111a", borderBottom: "1px solid #1a1d2e" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", color: "#6b6f8a", fontWeight: 600, fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>Player</th>
                <th style={{ padding: "14px 20px", textAlign: "left", color: "#6b6f8a", fontWeight: 600, fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>Club</th>
                <th style={{ padding: "14px 20px", textAlign: "left", color: "#6b6f8a", fontWeight: 600, fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>Contract</th>
                <th style={{ padding: "14px 20px", textAlign: "left", color: "#6b6f8a", fontWeight: 600, fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>Market Value</th>
                <th style={{ padding: "14px 20px", textAlign: "left", color: "#6b6f8a", fontWeight: 600, fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>Payment Status</th>
                <th style={{ padding: "14px 20px", textAlign: "left", color: "#6b6f8a", fontWeight: 600, fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>Amount</th>
                <th style={{ padding: "14px 20px", textAlign: "right", color: "#6b6f8a", fontWeight: 600, fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} style={{ borderBottom: "1px solid rgba(26,29,46,0.3)" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", backgroundColor: "#1a1d2e", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {player.photo ? <img src={player.photo} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "14px" }}>👤</span>}
                      </div>
                      <span style={{ fontWeight: 600, color: "#f5f5f5" }}>{player.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px", color: "#e8e8e8" }}>{player.club}</td>
                  <td style={{ padding: "14px 20px", color: "#e8e8e8" }}>{player.contract_end}</td>
                  <td style={{ padding: "14px 20px", color: "#22c55e", fontWeight: 700 }}>{player.market_value}</td>
                  <td style={{ padding: "14px 20px" }}><StatusBadge status={player.payment_status} /></td>
                  <td style={{ padding: "14px 20px", color: "#f5f5f5", fontWeight: 600 }}>{player.payment_amount}</td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <button onClick={() => handleEdit(player)} style={{ backgroundColor: "#1a1d2e", border: "1px solid #2a2d3e", color: "#e8e8e8", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", marginRight: "6px" }}>Edit</button>
                    <button onClick={() => handleDelete(player.id)} style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #1a1d2e", padding: "20px 32px", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "#4a4d5e" }}>© 2026 11WINS GmbH. All rights reserved. Munich, Germany.</p>
      </footer>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#141622", border: "1px solid #1a1d2e", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflow: "auto" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f5f5f5", margin: "0 0 24px" }}>{editingPlayer ? "Edit Player" : "Add New Player"}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#6b6f8a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>Player Photo</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "64px", height: "64px", backgroundColor: "#1a1d2e", borderRadius: "12px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {formData.photo ? <img src={formData.photo} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "24px" }}>👤</span>}
                    </div>
                    <div>
                      <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ backgroundColor: "#1a1d2e", border: "1px solid #2a2d3e", color: "#e8e8e8", padding: "8px 16px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", marginBottom: "4px" }}>{uploading ? "Uploading..." : "Upload Photo"}</button>
                      <p style={{ fontSize: "11px", color: "#4a4d5e", margin: 0 }}>Max 5MB, JPG/PNG/WebP</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#6b6f8a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>Name</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", backgroundColor: "#0f111a", border: "1px solid #1a1d2e", borderRadius: "8px", padding: "10px 14px", color: "#e8e8e8", fontSize: "14px", outline: "none" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#6b6f8a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>Club</label>
                    <input type="text" required value={formData.club} onChange={(e) => setFormData({ ...formData, club: e.target.value })} style={{ width: "100%", backgroundColor: "#0f111a", border: "1px solid #1a1d2e", borderRadius: "8px", padding: "10px 14px", color: "#e8e8e8", fontSize: "14px", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#6b6f8a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>Position</label>
                    <input type="text" required value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} style={{ width: "100%", backgroundColor: "#0f111a", border: "1px solid #1a1d2e", borderRadius: "8px", padding: "10px 14px", color: "#e8e8e8", fontSize: "14px", outline: "none" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#6b6f8a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>Age</label>
                    <input type="number" required value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} style={{ width: "100%", backgroundColor: "#0f111a", border: "1px solid #1a1d2e", borderRadius: "8px", padding: "10px 14px", color: "#e8e8e8", fontSize: "14px", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#6b6f8a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>Nationality</label>
                    <input type="text" required value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} style={{ width: "100%", backgroundColor: "#0f111a", border: "1px solid #1a1d2e", borderRadius: "8px", padding: "10px 14px", color: "#e8e8e8", fontSize: "14px", outline: "none" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#6b6f8a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>Contract End</label>
                    <input type="text" required value={formData.contract_end} onChange={(e) => setFormData({ ...formData, contract_end: e.target.value })} style={{ width: "100%", backgroundColor: "#0f111a", border: "1px solid #1a1d2e", borderRadius: "8px", padding: "10px 14px", color: "#e8e8e8", fontSize: "14px", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#6b6f8a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>Market Value</label>
                    <input type="text" required value={formData.market_value} onChange={(e) => setFormData({ ...formData, market_value: e.target.value })} style={{ width: "100%", backgroundColor: "#0f111a", border: "1px solid #1a1d2e", borderRadius: "8px", padding: "10px 14px", color: "#e8e8e8", fontSize: "14px", outline: "none" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#6b6f8a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>Payment Status</label>
                    <select value={formData.payment_status} onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as "paid" | "pending" | "overdue" })} style={{ width: "100%", backgroundColor: "#0f111a", border: "1px solid #1a1d2e", borderRadius: "8px", padding: "10px 14px", color: "#e8e8e8", fontSize: "14px", outline: "none", cursor: "pointer" }}>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#6b6f8a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>Payment Amount</label>
                    <input type="text" required value={formData.payment_amount} onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })} style={{ width: "100%", backgroundColor: "#0f111a", border: "1px solid #1a1d2e", borderRadius: "8px", padding: "10px 14px", color: "#e8e8e8", fontSize: "14px", outline: "none" }} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" id="verified" checked={formData.verified} onChange={(e) => setFormData({ ...formData, verified: e.target.checked })} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                  <label htmlFor="verified" style={{ fontSize: "14px", color: "#e8e8e8", cursor: "pointer" }}>Verified Player</label>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: "#1a1d2e", border: "1px solid #2a2d3e", color: "#e8e8e8", padding: "12px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ flex: 1, backgroundColor: "#c9a227", color: "#0a0a0f", border: "none", padding: "12px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>{editingPlayer ? "Update Player" : "Add Player"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}