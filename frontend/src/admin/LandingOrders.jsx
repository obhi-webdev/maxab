import LandingOrdersInline from "./LandingOrdersInline";

function getAdminToken() {
  return (
    sessionStorage.getItem("MAXPRODUCT-admin-token") ||
    localStorage.getItem("MAXPRODUCT-admin-token") ||
    ""
  );
}

export default function LandingOrders() {
  const token = getAdminToken();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f9fc",
        padding: "20px 14px",
        color: "#17202f",
        fontFamily: "Inter, system-ui, sans-serif"
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          minWidth: 0
        }}
      >
        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
            fontSize: 13
          }}
        >
          <a href="/admin/dashboard">
            ← Admin Dashboard
          </a>
          <a href="/admin/landing-pages">
            Landing Pages
          </a>
        </nav>

        {token ? (
          <LandingOrdersInline token={token} />
        ) : (
          <section
            style={{
              padding: 24,
              background: "#ffffff",
              borderRadius: 14,
              border: "1px solid #e2e8f0"
            }}
          >
            <h2>Admin Login Required</h2>
            <p>Please log in to manage landing page orders.</p>
            <a href="/admin">Go to Admin Login</a>
          </section>
        )}
      </div>
    </main>
  );
}
