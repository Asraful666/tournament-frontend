
import { Link, NavLink } from "react-router-dom";

import { ROLE_LABELS, normalizeRole } from "../services/roles";
import { useAuth } from "../services/auth-store";

const fallbackLinks = [
  { id: "overview", label: "Overview", path: "/dashboard/overview" },
  { id: "tournaments", label: "Tournaments", path: "/dashboard/tournaments" },
  { id: "matches", label: "Matches", path: "/dashboard/matches" },
  { id: "results", label: "Results", path: "/dashboard/results" },
];

export default function Navbar({ links }) {
  const { user, logout } = useAuth();

  const visibleLinks = Array.isArray(links) ? links : fallbackLinks;

  return (
    <header className="top-navbar">
      <Link to="/dashboard/overview" className="navbar-title">
        🏆 TourneyHub
      </Link>

      <nav aria-label="Main navigation" className="navbar-links">
        {visibleLinks.map(({ id, label, path }) => (
          <NavLink key={id} to={path}>
            {label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="navbar-user">

          {/* My Profile Navigation */}
          <Link
            to="/dashboard/profile"
            className="user-chip navbar-profile-link"
            title="My Profile"
            aria-label="Open My Profile"
          >
            <div className="navbar-avatar">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>

            <div className="navbar-user-copy">
              <strong>{user.name}</strong>
              <span>
                {ROLE_LABELS[normalizeRole(user.role)]}
              </span>
            </div>
          </Link>

          {/* Existing Logout Button */}
          <button
            type="button"
            className="secondary-button"
            onClick={logout}
          >
            Logout
          </button>

        </div>
      )}
    </header>
  );
}
