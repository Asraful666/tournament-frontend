import { useEffect, useState } from "react";

import { apiRequest } from "../services/api";

const numberFields = [
  { name: "won", label: "Won" },
  { name: "draw", label: "Draw" },
  { name: "lost", label: "Lost" },
  { name: "goals_for", label: "Goals for" },
  { name: "goals_against", label: "Goals against" },
];

const emptyForm = {
  tournament: "",
  team: "",
  won: "0",
  draw: "0",
  lost: "0",
  goals_for: "0",
  goals_against: "0",
};

export default function StandingsManager({ onChanged, readOnly = false }) {
  const [data, setData] = useState({
    "tournament-standings": [],
    tournaments: [],
    teams: [],
    "tournament-teams": [],
  });
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("");
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
        const names = [
          "tournament-standings",
          "tournaments",
          "teams",
          "tournament-teams",
        ];

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
  }, [reload]);

  const teamNames = new Map(
    data.teams.map((team) => [team.team_id, team.team_name])
  );

  const tournamentNames = new Map(
    data.tournaments.map((item) => [item.tournament_id, item.name])
  );

  const eligibleTeamIds = new Set(
    data["tournament-teams"]
      .filter((row) => row.tournament === Number(form.tournament))
      .map((row) => row.team)
  );

  const eligibleTeams = data.teams.filter(
    (team) => eligibleTeamIds.has(team.team_id)
  );

  const won = Number(form.won);
  const draw = Number(form.draw);
  const lost = Number(form.lost);
  const played = won + draw + lost;
  const difference =
    Number(form.goals_for) - Number(form.goals_against);
  const points = won * 3 + draw;

  const visibleRows = data["tournament-standings"]
    .filter((row) => !filter || row.tournament === Number(filter))
    .sort(
      (a, b) =>
        a.tournament - b.tournament ||
        (b.points ?? 0) - (a.points ?? 0) ||
        (b.goal_difference ?? 0) - (a.goal_difference ?? 0) ||
        (b.goals_for ?? 0) - (a.goals_for ?? 0) ||
        a.team - b.team
    );

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "tournament" ? { team: "" } : {}),
    }));
  }

  function editStanding(row) {
    setEditingId(row.standing_id);
    setForm({
      tournament: String(row.tournament),
      team: String(row.team),
      ...Object.fromEntries(
        numberFields.map((field) => [
          field.name,
          String(row[field.name] ?? 0),
        ])
      ),
    });
    setError("");
    setMessage("");
  }

  async function saveStanding(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (
      !form.tournament ||
      !form.team ||
      !eligibleTeamIds.has(Number(form.team))
    ) {
      setError("Tournament ও সেখানে registered একটি team নির্বাচন করো।");
      return;
    }

    const invalidNumber = numberFields.some(({ name }) => {
      const value = Number(form[name]);

      return (
        String(form[name]).trim() === "" ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > 2147483647
      );
    });

    if (invalidNumber || played > 2147483647 || points > 2147483647) {
      setError("পরিসংখ্যানগুলো বৈধ অঋণাত্মক পূর্ণসংখ্যা হতে হবে।");
      return;
    }

    if (
      data["tournament-standings"].some(
        (row) =>
          row.tournament === Number(form.tournament) &&
          row.team === Number(form.team) &&
          row.standing_id !== editingId
      )
    ) {
      setError("এই team-এর standing আছে। সেই record Edit করো।");
      return;
    }

    setBusy(true);

    try {
      await apiRequest(
        editingId !== null
          ? `/api/tournament-standings/${editingId}/`
          : "/api/tournament-standings/",
        {
          method: editingId !== null ? "PATCH" : "POST",
          body: JSON.stringify({
            tournament: Number(form.tournament),
            team: Number(form.team),
            ...Object.fromEntries(
              numberFields.map(({ name }) => [
                name,
                Number(form[name]),
              ])
            ),
            played,
            goal_difference: difference,
            points,
          }),
        }
      );

      resetForm();
      setMessage("Standing সংরক্ষণ হয়েছে।");
      setReload((value) => value + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteStanding(row) {
    if (!window.confirm("এই standing মুছে ফেলবে?")) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        `/api/tournament-standings/${row.standing_id}/`,
        { method: "DELETE" }
      );

      if (editingId === row.standing_id) resetForm();

      setMessage("Standing মুছে ফেলা হয়েছে।");
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id="standings">
      <div className="panel-header">
        <div>
          <h2>Standings Management</h2>
          <p>জয় ৩ পয়েন্ট, ড্র ১ পয়েন্ট।</p>
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
          <form className="team-form" onSubmit={saveStanding}>
            <h3>Read-only section</h3>
            <p>
              এই সেকশনে তুমি শুধু তথ্য দেখতে পারবে — তৈরি/পরিবর্তন/মুছে ফেলার
              অনুমতি নেই।
            </p>
          </form>
        ) : (
          <form className="team-form" onSubmit={saveStanding}>
          <h3>
            {editingId !== null ? "Edit Standing" : "Add Standing"}
          </h3>

          <fieldset
            disabled={loading || busy}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
          >
            <div className="form-grid">
              <label>
                Tournament *
                <select
                  name="tournament"
                  value={form.tournament}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select tournament</option>
                  {data.tournaments.map((item) => (
                    <option
                      key={item.tournament_id}
                      value={item.tournament_id}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Registered team *
                <select
                  name="team"
                  value={form.team}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select team</option>
                  {eligibleTeams.map((team) => (
                    <option key={team.team_id} value={team.team_id}>
                      {team.team_name}
                    </option>
                  ))}
                </select>
              </label>

              {numberFields.map((field) => (
                <label key={field.name}>
                  {field.label}
                  <input
                    type="number"
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    min="0"
                    max="2147483647"
                    step="1"
                    required
                  />
                </label>
              ))}
            </div>

            <p>
              Played: {played} | Goal difference: {difference}
              {" | "}Points: {points}
            </p>

            {form.tournament && eligibleTeams.length === 0 && (
              <p>
                আগে Team Registration থেকে এই tournament-এ team
                নিবন্ধন করো। তারপর Refresh চাপো।
              </p>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="refresh-button"
                disabled={eligibleTeams.length === 0}
              >
                {busy
                  ? "Processing..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Save Standing"}
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
        </form>
        )}

        {error && <p className="error-box" role="alert">{error}</p>}
        {message && (
          <p className="success-box" role="status">{message}</p>
        )}

        <div className="form-grid">
          <label>
            Filter by tournament
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="">All tournaments</option>
              {data.tournaments.map((item) => (
                <option
                  key={item.tournament_id}
                  value={item.tournament_id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <p className="empty-state">Standings লোড হচ্ছে...</p>
      ) : visibleRows.length === 0 ? (
        <p className="empty-state">কোনো standing নেই।</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tournament</th>
                <th>Team</th>
                <th>P</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GF</th>
                <th>GA</th>
                <th>GD</th>
                <th>Points</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.standing_id}>
                  <td>
                    {tournamentNames.get(row.tournament) ||
                      `Tournament #${row.tournament}`}
                  </td>
                  <td className="strong-cell">
                    {teamNames.get(row.team) || `Team #${row.team}`}
                  </td>
                  <td>{row.played ?? 0}</td>
                  <td>{row.won ?? 0}</td>
                  <td>{row.draw ?? 0}</td>
                  <td>{row.lost ?? 0}</td>
                  <td>{row.goals_for ?? 0}</td>
                  <td>{row.goals_against ?? 0}</td>
                  <td>{row.goal_difference ?? 0}</td>
                  <td className="strong-cell">{row.points ?? 0}</td>
                  <td>
                    <div className="row-actions">
                      {!readOnly && (
                        <>
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={busy}
                            onClick={() => editStanding(row)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="danger-button"
                            disabled={busy}
                            onClick={() => deleteStanding(row)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}