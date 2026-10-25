import { useEffect, useState } from "react";
import { ArrowLeft, Save, Truck } from "lucide-react";
import "./admin.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api');

export default function DeliverySettings() {
  const token = sessionStorage.getItem("maxab-admin-token");

  const [inside, setInside] = useState("");
  const [outside, setOutside] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(`${API}/settings/delivery`)
      .then(r => {
        if (!r.ok) throw new Error("Could not load settings");
        return r.json();
      })
      .then(r => {
        setInside(String(r.data.inside));
        setOutside(String(r.data.outside));
      })
      .catch(e => setError(e.message));
  }, [token]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/settings/delivery`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          inside: Number(inside),
          outside: Number(outside)
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Save failed");
      }

      setMessage("Delivery charges updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <h2>Admin Login Required</h2>
          <a href="/admin/login">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="delivery-settings-page">
      <div className="delivery-settings-card">
        <a href="/admin/dashboard" className="delivery-back">
          <ArrowLeft size={17}/> Back to Dashboard
        </a>

        <div className="delivery-settings-icon">
          <Truck size={30}/>
        </div>

        <h1>Delivery Settings</h1>
        <p>Manage your MAXAB checkout delivery charges.</p>

        {error && <div className="admin-error">{error}</div>}
        {message && <div className="admin-notice">{message}</div>}

        <form onSubmit={save}>
          <label>Inside City Delivery Charge (৳)</label>
          <input
            required
            type="number"
            min="0"
            max="1000"
            step="1"
            value={inside}
            onChange={e => setInside(e.target.value)}
          />

          <label>Outside City Delivery Charge (৳)</label>
          <input
            required
            type="number"
            min="0"
            max="1000"
            step="1"
            value={outside}
            onChange={e => setOutside(e.target.value)}
          />

          <button
            className="admin-primary"
            disabled={saving || inside === "" || outside === ""}
          >
            <Save size={18}/>
            {saving ? "Saving..." : "Save Delivery Charges"}
          </button>
        </form>
      </div>
    </div>
  );
}
