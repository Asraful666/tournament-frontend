import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AdminLayout({ links = [], topNavLinks = [] }) {
  const { pathname } = useLocation();

  // Each route is a full page: never carry the previous page's scroll
  // position into the next module.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <Link className="brand" to="/dashboard/overview">
          <span>🏆</span>
          <span>
            TourneyHub
            <small>Tournament Management</small>
          </span>
        </Link>

        <p className="nav-label">MANAGEMENT</p>

        <nav aria-label="Sidebar navigation">
          {links.map(({ id, label, path }) => (
            <NavLink key={id} to={path}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="page-column">
        <Navbar links={topNavLinks} />

        <main className="main-content">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
