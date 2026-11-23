import { useEffect, useState } from "react";

import PageHeader from "../components/PageHeader";
import { apiRequest } from "../services/api";
import { useAuth } from "../services/auth-store";
import { ROLE_LABELS, ROLES, normalizeRole } from "../services/roles";

const initialData = {
  teams: [],
  players: [],
  tournaments: [],
  matches: [],
};

const summaryResources = Object.keys(initialData);

const roleDescriptions = {
  [ROLES.viewer]:
    "সব তথ্য দেখা যাবে, তবে কোনো কিছু পরিবর্তন করা যাবে না (read-only).",
  [ROLES.player]:
    "নিজের প্রোফাইল, team ও tournament-এর সব তথ্য দেখা যাবে (read-only).",
  [ROLES.referee]:
    "নিজের assigned match-এর result জমা দেওয়া ও সব তথ্য দেখা যাবে.",
  [ROLES.team_manager]:
    "শুধু নিজের team ও তার player-রা পরিচালনা করা যাবে; বাকি সব read-only.",
  [ROLES.organizer]:
    "নিজের tournament ও তার match/result/registration পরিচালনা করা যাবে.",
  [ROLES.admin]:
    "সিস্টেমের পুরো নিয়ন্ত্রণ: সব resources, users ও role নির্ধারণ.",
};

export default function OverviewPage() {
  const { user, logout } = useAuth();
  const role = normalizeRole(user?.role);

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!user?.user_id) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadSummary() {
      setLoading(true);
      setError("");

      try {
        const entries = await Promise.all(
          summaryResources.map(async (resource) => {
            const items = await apiRequest(`/api/${resource}/`, {
              signal: controller.signal,
            });

            if (!Array.isArray(items)) {
              throw new Error(`${resource}: Invalid response format`);
            }

            return [resource, items];
          })
        );

        if (!controller.signal.aborted) {
          setData(Object.fromEntries(entries));
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || "Dashboard data could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSummary();

    return () => controller.abort();
  }, [reload, user?.user_id]);

  const stats = [
    { label: "Teams", value: data.teams.length, icon: "👥" },
    { label: "Players", value: data.players.length, icon: "🏃" },
    { label: "Tournaments", value: data.tournaments.length, icon: "🏆" },
    { label: "Matches", value: data.matches.length, icon: "⚽" },
  ];

  return (
    <>
      <PageHeader
        title={`${ROLE_LABELS[role]} Dashboard`}
        subtitle={roleDescriptions[role]}
        actions={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={logout}
            >
              Logout
            </button>

            <button
              type="button"
              className="refresh-button"
              onClick={() => setReload((value) => value + 1)}
              disabled={loading}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </>
        }
      />

      {error && (
        <div className="error-box" role="alert">
          <strong>Dashboard data could not be loaded.</strong>
          <p>{error}</p>
          <p>Check whether Django server and MySQL are running.</p>
        </div>
      )}

      {loading ? (
        <p role="status">Dashboard is loading...</p>
      ) : !error ? (
        <>
          <section className="stats-grid" aria-label="Dashboard Summary">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <span className="stat-icon">{stat.icon}</span>

                <div>
                  <p>{stat.label}</p>
                  <h2>{stat.value}</h2>
                </div>
              </article>
            ))}
          </section>

          {(role === ROLES.player || role === ROLES.team_manager) &&
            data.teams.length === 0 && (
              <div className="error-box" role="status">
                <p>
                  নিজের team-এর তথ্য দেখতে/পরিচালনা করতে Admin এর সাথে
                  link করা দরকার (Users &amp; Roles সেকশন)।
                </p>
              </div>
            )}
        </>
      ) : null}
    </>
  );
}
