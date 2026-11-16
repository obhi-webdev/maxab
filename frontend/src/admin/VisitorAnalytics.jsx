import { useCallback, useEffect, useState } from "react";
import {
  Users, Eye, Globe, MousePointer2,
  ShoppingBag, RefreshCw, Smartphone,
  Monitor, Tablet
} from "lucide-react";
import "./visitorAnalytics.css";

const API = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "/api"
    : "http://localhost:5001/api")
).replace(/\/$/, "");

const format = value =>
  Number(value || 0).toLocaleString("en-BD");

export default function VisitorAnalytics({ token }) {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async signal => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/visitor-analytics/summary?days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal,
          cache: "no-store"
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load visitor analytics"
        );
      }

      setData(result.data);
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [days, token]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const metrics = [
    {
      label: "Unique Sessions",
      value: data?.uniqueSessions,
      Icon: Users
    },
    {
      label: "Total Page Views",
      value: data?.totalViews,
      Icon: Eye
    },
    {
      label: "Website Views",
      value: data?.websiteViews,
      Icon: Globe
    },
    {
      label: "Landing Page Views",
      value: data?.landingViews,
      Icon: MousePointer2
    },
    {
      label: "Landing Orders Placed",
      value: data?.landingOrders,
      Icon: ShoppingBag
    }
  ];

  const timeline = data?.timeline || [];
  const maxViews = Math.max(
    1,
    ...timeline.map(item => item.views)
  );

  const devices = [
    ["Mobile", data?.devices?.mobile || 0, Smartphone],
    ["Desktop", data?.devices?.desktop || 0, Monitor],
    ["Tablet", data?.devices?.tablet || 0, Tablet]
  ];

  return (
    <section
      id="admin-visitor-analytics"
      className="mp-visitor-analytics"
    >
      <div className="mp-va-header">
        <div>
          <span className="mp-va-eyebrow">STORE INSIGHTS</span>
          <h2>Visitor Analytics</h2>
          <p>Website traffic and landing page performance</p>
        </div>

        <div className="mp-va-actions">
          <select
            aria-label="Analytics date range"
            value={days}
            onChange={e => setDays(Number(e.target.value))}
          >
            <option value="1">Today</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
          </select>

          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            aria-label="Refresh visitor analytics"
          >
            <RefreshCw size={17}/>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mp-va-error" role="alert">
          {error}
        </div>
      )}

      <div className="mp-va-metrics">
        {metrics.map(({ label, value, Icon }) => (
          <div className="mp-va-metric" key={label}>
            <div className="mp-va-metric-heading">
              <span>{label}</span>
              <Icon size={18}/>
            </div>
            <strong>
              {loading && !data ? "..." : format(value)}
            </strong>
          </div>
        ))}
      </div>

      <div className="mp-va-detail-grid">
        <div className="mp-va-card">
          <h3>Daily Page Views</h3>

          <div className="mp-va-bars">
            {timeline.map(item => (
              <div className="mp-va-bar-row" key={item.date}>
                <span>{item.date.slice(5)}</span>
                <div
                  className="mp-va-bar-track"
                  title={`${item.date}: ${item.views} views`}
                >
                  <div
                    className="mp-va-bar-fill"
                    style={{
                      width: `${item.views / maxViews * 100}%`
                    }}
                  />
                </div>
                <strong>{format(item.views)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="mp-va-card">
          <h3>Device Breakdown</h3>

          <div className="mp-va-devices">
            {devices.map(([label, count, Icon]) => (
              <div className="mp-va-device" key={label}>
                <div>
                  <Icon size={19}/>
                  <span>{label}</span>
                </div>
                <strong>{format(count)} views</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mp-va-card">
        <div className="mp-va-table-heading">
          <h3>Landing Page Performance</h3>
          <span>Orders submitted / page views</span>
        </div>

        <div className="mp-va-table-wrap">
          <table className="mp-va-table">
            <thead>
              <tr>
                <th>Landing Page</th>
                <th>Views</th>
                <th>Sessions</th>
                <th>Orders</th>
                <th>Order Rate</th>
              </tr>
            </thead>
            <tbody>
              {(data?.landingPages || []).map(page => (
                <tr key={page.slug}>
                  <td>
                    <a
                      href={`/lp/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {page.title}
                    </a>
                    <small>{page.status}</small>
                  </td>
                  <td>{format(page.views)}</td>
                  <td>{format(page.sessions)}</td>
                  <td>{format(page.orders)}</td>
                  <td>{page.orderRate}%</td>
                </tr>
              ))}

              {!data?.landingPages?.length && (
                <tr>
                  <td colSpan="5">
                    No landing pages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mp-va-note">
        Unique Sessions are anonymous browser-tab sessions,
        not verified individual people. Reports use UTC dates.
        Data collection begins after deployment.
      </p>
    </section>
  );
}
