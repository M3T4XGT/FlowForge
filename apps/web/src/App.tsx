
import { useEffect, useState } from "react";
import CreateOrganization from "./components/CreateOrganization";

import {
  LayoutDashboard,
  Building2,
  Workflow,
  ClipboardList,
  Settings,
  RefreshCw,
  AlertCircle,
  Plus,
} from "lucide-react";

import {
  getOrganizations,
  type Organization,
} from "./services/api";

import "./App.css";

function App() {
  // ==========================================
  // State Management
  // ==========================================

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ==========================================
  // Fetch Organizations from MongoDB API
  // ==========================================

  async function loadOrganizations() {
    setLoading(true);
    setError("");

    try {
      const data = await getOrganizations();
      setOrganizations(data);
    } catch (err) {
      console.error("Failed to load organizations:", err);
      setError("Unable to load organizations. Check your backend API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrganizations();
  }, []);

  // ==========================================
  // Handle Organization Creation
  // ==========================================

  function handleOrganizationCreated(organization: Organization) {
    setOrganizations((previous) => [
      organization,
      ...previous.filter((org) => org._id !== organization._id),
    ]);

    setShowCreateModal(false);
    setError("");
  }

  const activeOrganizations = organizations.filter(
    (org) => org.isActive
  ).length;

  // ==========================================
  // Dashboard
  // ==========================================

  return (
    <div className="app-layout">
      {/* =====================================
          Sidebar
      ===================================== */}

      <aside className="sidebar">
        <div className="brand">
          <Workflow size={28} />
          <span>FlowForge</span>
        </div>

        <nav className="nav-menu">
          <div className="nav-item active">
            <LayoutDashboard size={18} />
            Dashboard
          </div>

          <div className="nav-item">
            <Building2 size={18} />
            Organizations
          </div>

          <div className="nav-item">
            <Workflow size={18} />
            Workflows
          </div>

          <div className="nav-item">
            <ClipboardList size={18} />
            Tasks
          </div>

          <div className="nav-item">
            <Settings size={18} />
            Settings
          </div>
        </nav>

        <div className="sidebar-footer">
          FlowForge v0.1.0
        </div>
      </aside>

      {/* =====================================
          Main Content
      ===================================== */}

      <main className="main-content">
        {/* Page Header */}

        <header className="page-header">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h1>Dashboard</h1>
            <p className="subtitle">
              Manage your organizations and workflows.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <button
              type="button"
              className="refresh-button"
              onClick={() => void loadOrganizations()}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              New Organization
            </button>
          </div>
        </header>

        {/* =====================================
            Statistics
        ===================================== */}

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total Organizations</span>

            <strong>{organizations.length}</strong>

            <small>Organizations returned by API</small>
          </div>

          <div className="stat-card">
            <span>Active Organizations</span>

            <strong>{activeOrganizations}</strong>

            <small>Currently active</small>
          </div>
        </section>

        {/* =====================================
            Organizations Table
        ===================================== */}

        <section className="data-card">
          <div className="section-heading">
            <h2>Organizations</h2>
            <p>Live data retrieved from MongoDB Atlas</p>
          </div>

          {loading ? (
            <div className="empty-state">
              Loading organizations...
            </div>
          ) : error ? (
            <div className="error-state" role="alert">
              <AlertCircle size={20} />
              {error}
            </div>
          ) : organizations.length === 0 ? (
            <div className="empty-state">
              <Building2
                size={36}
                style={{ marginBottom: "12px" }}
              />

              <h3>No organizations found</h3>

              <p>
                Create your first organization to get started.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} />
                Create Organization
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {organizations.map((org) => (
                    <tr key={org._id}>
                      <td>
                        <div className="org-name">
                          {org.name}
                        </div>

                        <div className="org-description">
                          {org.description || "No description"}
                        </div>
                      </td>

                      <td>{org.slug}</td>

                      <td>
                        <span
                          className={
                            org.isActive
                              ? "status active-status"
                              : "status inactive-status"
                          }
                        >
                          {org.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {org.createdAt
                          ? new Date(
                              org.createdAt
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* =====================================
          Create Organization Modal
      ===================================== */}

      {showCreateModal && (
        <CreateOrganization
          onClose={() => setShowCreateModal(false)}
          onCreated={handleOrganizationCreated}
        />
      )}
    </div>
  );
}

export default App;
