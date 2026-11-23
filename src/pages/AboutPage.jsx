import { Link } from "react-router-dom";

import "./AboutPage.css";

/**
 * Public About page. Content is limited to modules and rules that
 * actually exist in this project (src/config/navigation.js,
 * src/services/roles.js and the backend API).
 */
const sports = [
  { icon: "⚽", label: "Football" },
  { icon: "🏏", label: "Cricket" },
  { icon: "🏀", label: "Basketball" },
  { icon: "🏐", label: "Volleyball" },
];

const features = [
  {
    icon: "👥",
    title: "Team Management",
    description:
      "Create and maintain team profiles with team name, coach and contact details. Team managers only manage their own team.",
  },
  {
    icon: "🏃",
    title: "Player Management",
    description:
      "Register players with their team, date of birth, position and jersey number, then edit or remove them as rosters change.",
  },
  {
    icon: "🏆",
    title: "Tournament Management",
    description:
      "Create tournaments with a name, description, start and end dates. Organizers manage the events they own.",
  },
  {
    icon: "🏟️",
    title: "Venue Management",
    description:
      "Keep the grounds and arenas used for matches on record, so every scheduled game points to a real venue.",
  },
  {
    icon: "🧑‍⚖️",
    title: "Referee Management",
    description:
      "Maintain referee records and assign officials to matches as main or assistant referees.",
  },
  {
    icon: "📅",
    title: "Match Management",
    description:
      "Schedule matches by tournament, venue, date, time and round, and assign the home and away teams for each game.",
  },
  {
    icon: "📝",
    title: "Team Registration",
    description:
      "Register teams into tournaments and keep each participation record connected to the correct event.",
  },
  {
    icon: "✅",
    title: "Results Management",
    description:
      "Record scores and notes for a match. Referees submit results for the matches assigned to them.",
  },
  {
    icon: "🥇",
    title: "Tournament Standings",
    description:
      "Track played, won, drawn, lost, goals for, goals against and points with 3-1-0 scoring, recalculated from results.",
  },
  {
    icon: "🛡️",
    title: "Users & Roles",
    description:
      "Admins manage accounts across six roles and link users to their team, player or referee record.",
  },
];

const reasons = [
  {
    title: "One source of truth",
    description:
      "Teams, players, tournaments, venues, matches and results are connected records instead of separate spreadsheets.",
  },
  {
    title: "Clear responsibilities",
    description:
      "Admins, organizers, referees, team managers, players and viewers each get access that matches their role.",
  },
  {
    title: "Results drive standings",
    description:
      "Standings are rebuilt after every result change, so the table always reflects the recorded matches.",
  },
];

function scrollToFeatures() {
  document
    .getElementById("features")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* ---------- Hero ---------- */}
      <section className="about-hero">
        <div className="public-shell about-hero-grid">
          <div className="about-hero-copy">
            <p className="about-eyebrow">Sports tournament management</p>

            <h1 className="about-hero-title">
              Welcome to <span>TourneyHub</span>
            </h1>

            <p className="about-hero-subtitle">
              Your Complete Sports Tournament Management Platform
            </p>

            <p className="about-hero-text">
              TourneyHub is a sports tournament management platform designed to
              simplify the organization and management of sports competitions.
              It provides tools to manage teams, players, tournaments, venues,
              referees, matches, results and standings in one centralized
              system.
            </p>

            <div className="about-hero-actions">
              <Link to="/register" className="about-btn about-btn-primary">
                Create an Account
              </Link>
              <Link to="/login" className="about-btn about-btn-outline">
                Sign In
              </Link>
              <button
                type="button"
                className="about-btn about-btn-text"
                onClick={scrollToFeatures}
              >
                Explore Features ↓
              </button>
            </div>
          </div>

          <div className="about-hero-visual" aria-hidden="true">
            <div className="about-visual-panel">
              <div className="about-visual-glow" />

              <div className="about-visual-head">
                <span className="about-visual-badge">🏆</span>
                <div>
                  <strong>One platform. Every sport.</strong>
                  <small>Teams · Players · Matches · Results</small>
                </div>
              </div>

              <div className="about-sport-grid">
                {sports.map((sport) => (
                  <div className="about-sport-tile" key={sport.label}>
                    <span>{sport.icon}</span>
                    <strong>{sport.label}</strong>
                  </div>
                ))}
              </div>

              <div className="about-visual-foot">
                <span>Tournament operations</span>
                <span>Built for organizers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Sports strip ---------- */}
      <div className="about-sports-strip">
        <div className="public-shell about-sports-inner">
          <p>Built for multi-sport competition</p>
          <ul>
            {sports.map((sport) => (
              <li key={sport.label}>
                <span aria-hidden="true">{sport.icon}</span>
                {sport.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---------- About ---------- */}
      <section className="about-section" id="about">
        <div className="public-shell">
          <header className="about-section-head">
            <p className="about-eyebrow">About TourneyHub</p>
            <h2>A single system for the whole competition.</h2>
          </header>

          <div className="about-story">
            <div className="about-story-copy">
              <p>
                TourneyHub is a web-based tournament management system built for
                sports organizers. It pairs a Django REST API and a MySQL
                database with a React dashboard, so every page works from the
                same connected data instead of a collection of separate files.
              </p>
              <p>
                It was developed to replace the usual mix of spreadsheets,
                messaging groups and handwritten notes that becomes difficult to
                manage as an event grows. Those tools make it easy for a player
                to be linked to the wrong team, a match to be scheduled without a
                venue, or a result to never reach the standings.
              </p>
              <p>
                Administrators use TourneyHub to create tournaments, register
                teams, schedule matches, assign home and away sides, attach
                referees, and record results. Teams and players are maintained
                as linked records, referees are tied to the matches they
                officiate, and standings are recalculated automatically after
                every result.
              </p>
              <p>
                Access follows the responsibilities of each role. Admins manage
                the full system and user accounts. Organizers run the
                tournaments they own. Referees record results for their assigned
                matches. Team managers maintain their own team and players, while
                players and viewers get read-only access. The backend enforces
                these rules on every request.
              </p>
            </div>

            <aside className="about-why" aria-labelledby="about-why-title">
              <h3 id="about-why-title">Why it exists</h3>
              <ul>
                {reasons.map((reason) => (
                  <li key={reason.title}>
                    <strong>{reason.title}</strong>
                    <p>{reason.description}</p>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="about-section about-features" id="features">
        <div className="public-shell">
          <header className="about-section-head centered">
            <p className="about-eyebrow">Platform features</p>
            <h2>Everything needed to run a tournament.</h2>
            <p>
              These are the modules available in the TourneyHub dashboard. What
              you can access depends on your role.
            </p>
          </header>

          <div className="about-feature-grid">
            {features.map((feature) => (
              <article className="about-feature" key={feature.title}>
                <span className="about-feature-icon" aria-hidden="true">
                  {feature.icon}
                </span>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="about-cta">
        <div className="public-shell">
          <div className="about-cta-inner">
            <div>
              <p className="about-eyebrow">Ready to get started?</p>
              <h2>Manage your next tournament with TourneyHub.</h2>
              <p className="about-cta-text">
                Sign in to your existing account, or register to enter the
                dashboard. New accounts start with the Viewer role and can be
                updated by an administrator.
              </p>
            </div>

            <div className="about-cta-actions">
              <Link to="/login" className="about-btn about-btn-light">
                Sign In
              </Link>
              <Link to="/register" className="about-btn about-btn-primary">
                Create an Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
