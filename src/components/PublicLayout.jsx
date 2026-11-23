import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import "./PublicLayout.css";

/**
 * Public website shell: sticky horizontal navigation on top, page
 * content in the middle, footer at the bottom. Shared by the About,
 * Sign In and Register routes so navigation stays consistent.
 */
export default function PublicLayout() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const aboutActive = pathname === "/" || pathname === "/about";

  // Public pages start at the top, like the dashboard modules.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function goToAbout(event) {
    closeMenu();

    // Already on the About page: scroll back to the hero instead of
    // doing nothing. (HashRouter owns the URL hash, so no href="#".)
    if (aboutActive) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="public-layout">
      <header className="public-navbar">
        <div className="public-navbar-inner">
          <Link to="/" className="public-brand" onClick={goToAbout}>
            <span className="public-brand-mark" aria-hidden="true">
              🏆
            </span>
            <span className="public-brand-copy">
              <strong>TourneyHub</strong>
              <small>Sports Tournament Management</small>
            </span>
          </Link>

          <button
            type="button"
            className={`public-menu-toggle${menuOpen ? " open" : ""}`}
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            aria-controls="public-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav
            id="public-navigation"
            className={`public-nav-menu${menuOpen ? " open" : ""}`}
            aria-label="Public navigation"
          >
            <Link
              to="/"
              className={`public-nav-link${aboutActive ? " active" : ""}`}
              aria-current={aboutActive ? "page" : undefined}
              onClick={goToAbout}
            >
              About
            </Link>

            <NavLink
              to="/login"
              className={({ isActive }) =>
                `public-nav-link${isActive ? " active" : ""}`
              }
              onClick={closeMenu}
            >
              Sign In
            </NavLink>

            <NavLink
              to="/register"
              className={({ isActive }) =>
                `public-nav-register${isActive ? " active" : ""}`
              }
              onClick={closeMenu}
            >
              Register
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="public-content">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="public-shell public-footer-grid">
          <div className="public-footer-brand">
            <Link to="/" className="public-footer-logo" onClick={closeMenu}>
              <span aria-hidden="true">🏆</span>
              <strong>TourneyHub</strong>
            </Link>
            <p>
              A sports tournament management platform for organizing teams,
              players, venues, referees, matches, results and standings in one
              centralized system.
            </p>
          </div>

          <nav className="public-footer-col" aria-label="Footer navigation">
            <h3>Platform</h3>
            <Link to="/" onClick={closeMenu}>
              About
            </Link>
            <Link to="/login" onClick={closeMenu}>
              Sign In
            </Link>
            <Link to="/register" onClick={closeMenu}>
              Sign Up
            </Link>
          </nav>

          <div className="public-footer-col">
            <h3>Sports</h3>
            <span>Football</span>
            <span>Cricket</span>
            <span>Basketball</span>
            <span>Volleyball</span>
          </div>
        </div>

        <div className="public-shell public-footer-bottom">
          <p>© {new Date().getFullYear()} TourneyHub. All rights reserved.</p>
          <p>Sports tournament management, end to end.</p>
        </div>
      </footer>
    </div>
  );
}
