
import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "./components/AdminLayout";
import LoginSignup from "./components/LoginSignup";
import PublicLayout from "./components/PublicLayout";
import { NAV_SECTIONS, TOP_NAV_IDS } from "./config/navigation";

import AboutPage from "./pages/AboutPage";
import MatchRefereesPage from "./pages/MatchRefereesPage";
import MatchTeamsPage from "./pages/MatchTeamsPage";
import MatchesPage from "./pages/MatchesPage";
import OverviewPage from "./pages/OverviewPage";
import PlayersPage from "./pages/PlayersPage";
import RefereesPage from "./pages/RefereesPage";
import ResultsPage from "./pages/ResultsPage";
import StandingsPage from "./pages/StandingsPage";
import TeamRegistrationPage from "./pages/TeamRegistrationPage";
import TeamsPage from "./pages/TeamsPage";
import TournamentsPage from "./pages/TournamentsPage";
import UsersPage from "./pages/UsersPage";
import VenuesPage from "./pages/VenuesPage";
import ProfilePage from "./pages/ProfilePage";

import { useAuth } from "./services/auth-store";
import { normalizeRole, visibleSections } from "./services/roles";

const PAGE_COMPONENTS = {
  overview: OverviewPage,
  teams: TeamsPage,
  players: PlayersPage,
  tournaments: TournamentsPage,
  venues: VenuesPage,
  referees: RefereesPage,
  matches: MatchesPage,
  "tournament-teams": TeamRegistrationPage,
  "match-teams": MatchTeamsPage,
  "match-referees": MatchRefereesPage,
  results: ResultsPage,
  standings: StandingsPage,
  users: UsersPage,
};

export default function App() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="auth-screen">
        <p role="status">Loading...</p>
      </div>
    );
  }

  const role = user ? normalizeRole(user.role) : null;

  const visibleLinks = user
    ? visibleSections(role, NAV_SECTIONS)
    : [];

  const topNavLinks = visibleLinks.filter(({ id }) =>
    TOP_NAV_IDS.has(id)
  );

  return (
    <Routes>

      {/* Public Website */}
      <Route
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <PublicLayout />
          )
        }
      >
        <Route path="/" element={<AboutPage />} />
        <Route path="/about" element={<AboutPage />} />

        <Route
          path="/login"
          element={
            <LoginSignup
              key="login"
              mode="login"
              embedded
            />
          }
        />

        <Route
          path="/register"
          element={
            <LoginSignup
              key="register"
              mode="signup"
              embedded
            />
          }
        />
      </Route>

      {/* Protected Dashboard */}
      <Route
        path="/dashboard"
        element={
          user ? (
            <AdminLayout
              links={visibleLinks}
              topNavLinks={topNavLinks}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >

        <Route
          index
          element={<Navigate to="/dashboard/overview" replace />}
        />

        {visibleLinks.map(({ id }) => {
          const Page = PAGE_COMPONENTS[id];

          if (!Page) return null;

          return (
            <Route
              key={id}
              path={id}
              element={<Page />}
            />
          );
        })}

        {/* NEW: My Profile Page */}
        <Route
          path="profile"
          element={<ProfilePage />}
        />

        {/* Dashboard Fallback */}
        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard/overview"
              replace
            />
          }
        />

      </Route>

      {/* Global Fallback */}
      <Route
        path="*"
        element={
          <Navigate
            to={user ? "/dashboard" : "/"}
            replace
          />
        }
      />

    </Routes>
  );
}
