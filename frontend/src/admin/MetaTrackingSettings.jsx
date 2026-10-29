import { useEffect, useState } from "react";
import {
  ArrowLeft, Save, ShieldCheck,
  Eye, EyeOff, Activity
} from "lucide-react";

import "./metaTrackingSettings.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api');

export default function MetaTrackingSettings() {
  const token = sessionStorage.getItem("MAXPRODUCT-admin-token");

  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [testEventCode, setTestEventCode] = useState("");
  const [testMode, setTestMode] = useState(false);
  const [tokenConfigured, setTokenConfigured] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API}/meta-settings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Could not load settings");
        }

        return data;
      })
      .then(result => {
        setPixelId(result.data.pixelId || "");
        setEnabled(result.data.enabled);
        setTokenConfigured(result.data.tokenConfigured);
        setTestEventCode(result.data.testEventCode || "");
        setTestMode(Boolean(result.data.testMode));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function save(event) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        pixelId: pixelId.trim(),
        enabled,
        testEventCode: testEventCode.trim(),
        testMode
      };

      // Blank token means keep the previous token.
      if (accessToken.trim()) {
        payload.accessToken = accessToken.trim();
      }

      const response = await fetch(`${API}/meta-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Save failed");
      }

      setPixelId(result.data.pixelId);
      setEnabled(result.data.enabled);
      setTokenConfigured(result.data.tokenConfigured);
      setTestEventCode(result.data.testEventCode || "");
      setTestMode(Boolean(result.data.testMode));
      setAccessToken("");
      setShowToken(false);
      setNotice("Meta Pixel settings saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <main className="maxab-meta-page">
        <div className="maxab-meta-card">
          <h2>Admin Login Required</h2>
          <a href="/admin/login">Login to MAXPRODUCT</a>
        </div>
      </main>
    );
  }

  return (
    <div className="maxab-meta-page">
      <main className="maxab-meta-container">

        <a href="/admin/dashboard" className="maxab-meta-back">
          <ArrowLeft size={17}/> Back to Dashboard
        </a>

        <div className="maxab-meta-heading">
          <span>MAXPRODUCT MARKETING INTEGRATIONS</span>
          <h1>Meta Pixel & Conversions API</h1>
          <p>
            Configure your Meta Dataset and secure
            server-side Access Token.
          </p>
        </div>

        <div className="maxab-meta-layout">
          <form className="maxab-meta-card" onSubmit={save}>
            <h2>Tracking Configuration</h2>

            {error && (
              <div className="maxab-meta-error">{error}</div>
            )}

            {notice && (
              <div className="maxab-meta-notice">{notice}</div>
            )}

            <label>Meta Pixel / Dataset ID</label>

            <input
              required
              type="text"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]{10,25}"
              placeholder="Enter your Pixel ID"
              value={pixelId}
              onChange={event => setPixelId(event.target.value)}
              disabled={busy || loading}
            />

            <small>
              Find it in Meta Events Manager → Data Sources.
            </small>

            <label>Conversions API Access Token</label>

            <div className="maxab-meta-token">
              <input
                type={showToken ? "text" : "password"}
                autoComplete="new-password"
                placeholder={
                  tokenConfigured
                    ? "Saved securely — enter only to replace"
                    : "Paste CAPI Access Token"
                }
                value={accessToken}
                onChange={event => setAccessToken(event.target.value)}
                disabled={busy || loading}
              />

              <button
                type="button"
                onClick={() => setShowToken(value => !value)}
                aria-label={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>

            <small>
              Existing Access Token is never displayed again.
            </small>

            <label className="maxab-meta-switch">
              <input
                type="checkbox"
                checked={enabled}
                onChange={event => setEnabled(event.target.checked)}
                disabled={busy || loading}
              />

              <div>
                <strong>Enable Meta Tracking</strong>
                <span>
                  Allow the configured integration to run.
                </span>
              </div>
            </label>

            <div className="maxab-meta-test-section">
              <h3>Conversions API Test Events</h3>

              <label htmlFor="maxab-test-event-code">
                Test Event Code
              </label>

              <input
                id="maxab-test-event-code"
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="TEST12345"
                value={testEventCode}
                onChange={event =>
                  setTestEventCode(event.target.value)
                }
                disabled={busy || loading}
              />

              <small>
                Copy this code from Meta Events Manager,
                under Test Events. Leave it blank when
                testing is not required.
              </small>

              <label className="maxab-meta-switch">
                <input
                  type="checkbox"
                  checked={testMode}
                  onChange={event =>
                    setTestMode(event.target.checked)
                  }
                  disabled={busy || loading}
                />

                <div>
                  <strong>Enable Test Mode</strong>
                  <span>
                    Attach the saved Test Event Code to
                    server-side Purchase events.
                  </span>
                </div>
              </label>
            </div>

            <button
              className="maxab-meta-save"
              disabled={busy || loading}
            >
              <Save size={18}/>
              {busy ? "Saving..." : "Save Meta Settings"}
            </button>
          </form>

          <aside className="maxab-meta-card MAXPRODUCT-meta-status">
            <Activity size={28}/>

            <h2>Integration Status</h2>

            <div>
              <span>Pixel ID</span>
              <strong>
                {pixelId ? "Configured" : "Not configured"}
              </strong>
            </div>

            <div>
              <span>Access Token</span>
              <strong>
                {tokenConfigured ? "Saved securely" : "Not configured"}
              </strong>
            </div>

            <div>
              <span>Tracking</span>
              <strong>
                {enabled ? "Enabled in settings" : "Disabled"}
              </strong>
            </div>

            <div>
              <span>CAPI Test Mode</span>
              <strong>
                {testMode ? "Enabled" : "Disabled"}
              </strong>
            </div>

            <div className="maxab-meta-security">
              <ShieldCheck size={21}/>
              <p>
                Access Token is kept on the server.
                Your customers cannot retrieve it
                through the public settings endpoint.
              </p>
            </div>

            <p className="maxab-meta-footnote">
              Configuration status does not confirm
              that Meta is receiving events.
              Verify event delivery in Events Manager.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
