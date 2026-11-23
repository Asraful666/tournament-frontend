import { useEffect, useState } from "react";

import { apiRequest } from "../services/api";

const emptyForm = {
  name: "",
  team: "",
  date_of_birth: "",
  position: "",
  jersey_no: "",
};

export default function PlayersManager({
  onChanged,
  readOnly = false,
  ownTeamId = null,
}) {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
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
        const [playerData, teamData] = await Promise.all([
          apiRequest("/api/players/", { signal: controller.signal }),
          apiRequest("/api/teams/", { signal: controller.signal }),
        ]);

        if (!Array.isArray(playerData) || !Array.isArray(teamData)) {
          throw new Error("API response সঠিক নয়।");
        }

        if (!controller.signal.aborted) {
          setPlayers(playerData);
          setTeams(teamData);
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

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function editPlayer(player) {
    setEditingId(player.player_id);
    setForm({
      name: player.name || "",
      team: String(player.team),
      date_of_birth: player.date_of_birth || "",
      position: player.position || "",
      jersey_no: player.jersey_no ?? "",
    });
    setError("");
    setMessage("");
  }

  async function savePlayer(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.name.trim() || !form.team) {
      setError("Player name ও team দিতে হবে।");
      return;
    }

    const payload = {
      name: form.name.trim(),
      team: Number(form.team),
      date_of_birth: form.date_of_birth || null,
      position: form.position.trim(),
      jersey_no:
        form.jersey_no === "" ? null : Number(form.jersey_no),
    };

    setBusy(true);

    try {
      const isEditing = editingId !== null;

      await apiRequest(
        isEditing ? `/api/players/${editingId}/` : "/api/players/",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      resetForm();
      setMessage(
        isEditing ? "Player update হয়েছে।" : "নতুন player যোগ হয়েছে।"
      );
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deletePlayer(player) {
    if (!window.confirm(`"${player.name}" মুছে ফেলতে চাও?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/api/players/${player.player_id}/`, {
        method: "DELETE",
      });

      if (editingId === player.player_id) resetForm();

      setMessage("Player মুছে ফেলা হয়েছে।");
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const teamNames = new Map(
    teams.map((team) => [team.team_id, team.team_name])
  );

  function canManageRow(player) {
    return (
      !readOnly &&
      (ownTeamId === null || player.team === ownTeamId)
    );
  }

  return (
    <section className="panel" id="players">
      <div className="panel-header">
        <div>
          <h2>Players Management</h2>
          <p>Player-এর তথ্য ও team পরিচালনা করো।</p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => setReload((value) => value + 1)}
          disabled={loading || busy}
        >
          Refresh
        </button>
      </div>

      <div className="manager-body">
        {readOnly ? (
          <form className="team-form" onSubmit={savePlayer}>
            <h3>Read-only section</h3>
            <p>
              এই সেকশনে তুমি শুধু তথ্য দেখতে পারবে — তৈরি/পরিবর্তন/মুছে ফেলার
              অনুমতি নেই।
            </p>
          </form>
        ) : (
          <form className="team-form" onSubmit={savePlayer}>
          <h3>{editingId !== null ? "Edit Player" : "Add Player"}</h3>

          <fieldset
            disabled={busy || loading}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
          >
            <div className="form-grid">
              <label>
                Player name *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Team *
                <select
                  name="team"
                  value={form.team}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select team</option>
                  {teams.map((team) => (
                    <option key={team.team_id} value={team.team_id}>
                      {team.team_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Date of birth
                <input
                  type="date"
                  name="date_of_birth"
                  value={form.date_of_birth}
                  onChange={handleChange}
                />
              </label>

              <label>
                Position
                <input
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  maxLength={50}
                  placeholder="যেমন: Forward"
                />
              </label>

              <label>
                Jersey number
                <input
                  type="number"
                  name="jersey_no"
                  value={form.jersey_no}
                  onChange={handleChange}
                  min="0"
                  max="2147483647"
                  step="1"
                />
              </label>
            </div>

            {ownTeamId !== null && (
              <p>
                তুমি শুধু নিজের team-এর (#{ownTeamId}) player-রা পরিচালনা করতে
                পারবে।
              </p>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="refresh-button"
                disabled={teams.length === 0}
              >
                {busy
                  ? "Processing..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Add Player"}
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

          {!loading && teams.length === 0 && (
            <p>Player যোগ করার আগে একটি team তৈরি করো।</p>
          )}
        </form>
        )}

        {error && <p className="error-box" role="alert">{error}</p>}
        {message && (
          <p className="success-box" role="status">{message}</p>
        )}
      </div>

      {loading ? (
        <p className="empty-state">Players লোড হচ্ছে...</p>
      ) : players.length === 0 ? (
        <p className="empty-state">কোনো player নেই।</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Team</th>
                <th>Date of birth</th>
                <th>Position</th>
                <th>Jersey</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.player_id}>
                  <td className="strong-cell">{player.name}</td>
                  <td>
                    {teamNames.get(player.team) || `Team #${player.team}`}
                  </td>
                  <td>{player.date_of_birth || "—"}</td>
                  <td>{player.position || "—"}</td>
                  <td>{player.jersey_no ?? "—"}</td>
                  <td>
                    <div className="row-actions">
                      {canManageRow(player) && (
                        <button
                          className="secondary-button"
                          disabled={busy}
                          onClick={() => editPlayer(player)}
                        >
                          Edit
                        </button>
                      )}
                      {canManageRow(player) && (
                        <button
                          className="danger-button"
                          disabled={busy}
                          onClick={() => deletePlayer(player)}
                        >
                          Delete
                        </button>
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
