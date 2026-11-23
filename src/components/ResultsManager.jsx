import { useEffect, useState } from "react";

import { apiRequest } from "../services/api";
import { useAuth } from "../services/auth-store";
import { normalizeRole, ROLES } from "../services/roles";

const emptyForm = {
  match: "",
  team1_score: "0",
  team2_score: "0",
  notes: "",
};

export default function ResultsManager({
  onChanged,
  readOnly = false,
  role = null,
}) {
  const normalizedRole = normalizeRole(role);
  // /auth/me supplies this referee's identity link; combined with the
  // match-referees table it scopes the referee to their own matches
  // (the backend enforces the same rule).
  const { user } = useAuth();
  const myRefereeId = normalizedRole === ROLES.referee ? user?.referee : null;
  const [data, setData] = useState({
    results: [],
    matches: [],
    teams: [],
    "match-teams": [],
  });
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const names = ["results", "matches", "teams", "match-teams"];

        // Referees need the assignment table to scope their own matches.
        if (normalizedRole === ROLES.referee) {
          names.push("match-referees");
        }

        const entries = await Promise.all(
          names.map(async (name) => {
            const rows = await apiRequest(`/api/${name}/`, {
              signal: controller.signal,
            });

            if (!Array.isArray(rows)) {
              throw new Error(`${name}: ভুল API response`);
            }

            return [name, rows];
          })
        );

        if (!controller.signal.aborted) {
          setData(Object.fromEntries(entries));
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadData();
    return () => controller.abort();
  }, [reload, normalizedRole]);

  const teamNames = new Map(
    data.teams.map((team) => [team.team_id, team.team_name])
  );

  // Matches this referee is assigned to (empty for every other role —
  // they are not scoped).
  const assignedMatchIds = new Set(
    myRefereeId === null
      ? []
      : (data["match-referees"] ?? [])
          .filter((row) => row.referee === myRefereeId)
          .map((row) => row.match)
  );

  // Referees pick from their assigned matches only; other roles see all.
  const selectableMatches =
    normalizedRole === ROLES.referee
      ? data.matches.filter(
          (match) =>
            assignedMatchIds.size === 0 ||
            assignedMatchIds.has(match.match_id)
        )
      : data.matches;

  function getSides(matchId) {
    const assignments = data["match-teams"].filter(
      (row) => row.match === Number(matchId)
    );

    const home = assignments.filter(
      (row) => row.team_side === "Home"
    );
    const away = assignments.filter(
      (row) => row.team_side === "Away"
    );

    if (
      assignments.length !== 2 ||
      home.length !== 1 ||
      away.length !== 1 ||
      home[0].team === away[0].team
    ) {
      return null;
    }

    return { home: home[0].team, away: away[0].team };
  }

  const sides = getSides(form.match);

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function editResult(result) {
    setEditingId(result.result_id);
    setForm({
      match: String(result.match),
      team1_score: String(result.team1_score ?? 0),
      team2_score: String(result.team2_score ?? 0),
      notes: result.notes || "",
    });
    setError("");
    setMessage("");
  }

  async function saveResult(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.match || !sides) {
      setError("Match-এ একটি Home ও একটি Away team assign করতে হবে।");
      return;
    }

    if (
      normalizedRole === ROLES.referee &&
      !assignedMatchIds.has(Number(form.match))
    ) {
      setError("তুমি শুধু নিজের assigned match-এর result জমা দিতে পারো।");
      return;
    }

    const homeScore = Number(form.team1_score);
    const awayScore = Number(form.team2_score);

    if (
      [form.team1_score, form.team2_score].some(
        (value) => value.trim() === ""
      ) ||
      [homeScore, awayScore].some(
        (score) =>
          !Number.isInteger(score) ||
          score < 0 ||
          score > 2147483647
      )
    ) {
      setError("Score অঋণাত্মক পূর্ণসংখ্যা হতে হবে।");
      return;
    }

    if (
      data.results.some(
        (row) =>
          row.match === Number(form.match) &&
          row.result_id !== editingId
      )
    ) {
      setError("এই match-এর result আছে। নতুন না দিয়ে সেটি Edit করো।");
      return;
    }

    const winner =
      homeScore === awayScore
        ? null
        : homeScore > awayScore
          ? sides.home
          : sides.away;

    setBusy(true);

    try {
      await apiRequest(
        editingId !== null
          ? `/api/results/${editingId}/`
          : "/api/results/",
        {
          method: editingId !== null ? "PATCH" : "POST",
          body: JSON.stringify({
            match: Number(form.match),
            team1_score: homeScore,
            team2_score: awayScore,
            winner_team: winner,
            notes: form.notes.trim(),
          }),
        }
      );

      resetForm();
      setMessage("Result সংরক্ষণ হয়েছে।");
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteResult(result) {
    if (!window.confirm("এই result মুছে ফেলবে?")) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/api/results/${result.result_id}/`, {
        method: "DELETE",
      });

      if (editingId === result.result_id) resetForm();

      setMessage("Result মুছে ফেলা হয়েছে।");
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id="results">
      <div className="panel-header">
        <div>
          <h2>Results Management</h2>
          <p>Home ও Away team-এর score সংরক্ষণ করো।</p>
        </div>

        <button
          type="button"
          className="secondary-button"
          disabled={loading || busy}
          onClick={() => setReload((value) => value + 1)}
        >
          Refresh
        </button>
      </div>

      <div className="manager-body">
        {readOnly ? (
          <form className="team-form" onSubmit={saveResult}>
            <h3>Read-only section</h3>
            <p>
              এই সেকশনে তুমি শুধু তথ্য দেখতে পারবে — তৈরি/পরিবর্তন/মুছে ফেলার
              অনুমতি নেই।
            </p>
          </form>
        ) : (
          <form className="team-form" onSubmit={saveResult}>
          <h3>{editingId !== null ? "Edit Result" : "Add Result"}</h3>

          <fieldset
            disabled={loading || busy}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
          >
            <div className="form-grid">
              <label>
                Match *
                <select
                  name="match"
                  value={form.match}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select match</option>
                  {selectableMatches.map((match) => (
                    <option key={match.match_id} value={match.match_id}>
                      Match #{match.match_id} — {match.round || "—"}
                      {" — "}
                      {match.match_date || "তারিখ নেই"}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Home score
                {sides ? ` — ${teamNames.get(sides.home)}` : ""}
                <input
                  type="number"
                  name="team1_score"
                  value={form.team1_score}
                  onChange={handleChange}
                  min="0"
                  max="2147483647"
                  step="1"
                  required
                />
              </label>

              <label>
                Away score
                {sides ? ` — ${teamNames.get(sides.away)}` : ""}
                <input
                  type="number"
                  name="team2_score"
                  value={form.team2_score}
                  onChange={handleChange}
                  min="0"
                  max="2147483647"
                  step="1"
                  required
                />
              </label>

              <label>
                Notes
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                />
              </label>
            </div>

            {form.match && !sides && (
              <p role="status">
                আগে Match Teams থেকে একটি Home ও একটি Away team
                assign করো। তারপর Refresh চাপো।
              </p>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="refresh-button"
                disabled={!sides}
              >
                {busy
                  ? "Processing..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Save Result"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </fieldset>

          {normalizedRole === ROLES.referee && (
            <p>
              Referee হিসেবে তুমি শুধু নিজের assigned match-এর result
              জমা দিতে/পরিবর্তন করতে পারবে।
            </p>
          )}
        </form>
        )}

        {error && <p className="error-box" role="alert">{error}</p>}
        {message && (
          <p className="success-box" role="status">{message}</p>
        )}
      </div>

      {loading ? (
        <p className="empty-state">Results লোড হচ্ছে...</p>
      ) : data.results.length === 0 ? (
        <p className="empty-state">কোনো result নেই।</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Match</th>
                <th>Home / Away</th>
                <th>Score</th>
                <th>Winner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((result) => {
                const matchSides = getSides(result.match);

                return (
                  <tr key={result.result_id}>
                    <td>#{result.match}</td>
                    <td>
                      {matchSides
                        ? `${teamNames.get(matchSides.home)} / ${
                            teamNames.get(matchSides.away)
                          }`
                        : "Team assignment যাচাই করো"}
                    </td>
                    <td>
                      {result.team1_score ?? "—"}
                      {" : "}
                      {result.team2_score ?? "—"}
                    </td>
                    <td>
                      {result.winner_team === null
                        ? result.team1_score !== null &&
                          result.team2_score !== null &&
                          result.team1_score === result.team2_score
                          ? "Draw"
                          : "নির্ধারিত নয়"
                        : teamNames.get(result.winner_team) ||
                          `Team #${result.winner_team}`}
                    </td>
                    <td>
                      <div className="row-actions">
                        {(() => {
                          const canEditRow =
                            !readOnly &&
                            (normalizedRole !== ROLES.referee ||
                              assignedMatchIds.has(result.match));

                          return canEditRow ? (
                            <button
                              type="button"
                              className="secondary-button"
                              disabled={busy}
                              onClick={() => editResult(result)}
                            >
                              Edit
                            </button>
                          ) : null;
                        })()}
                        {!readOnly &&
                          normalizedRole !== ROLES.referee && (
                            <button
                              type="button"
                              className="danger-button"
                              disabled={busy}
                              onClick={() => deleteResult(result)}
                            >
                              Delete
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}