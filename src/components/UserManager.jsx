import { useEffect, useState } from "react";

import { apiRequest } from "../services/api";
import {
  ALL_ROLES,
  ROLE_LABELS,
  normalizeRole,
} from "../services/roles";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "viewer",
  team: "",
  player: "",
  referee: "",
};

/**
 * Admin-only user management: create users with any of the six roles,
 * change roles, and link a user to its Team/Player/Referee identity
 * (needed for object-level permissions like "own team only").
 */
export default function UserManager({ onChanged }) {
  const [users, setUsers] = useState([]);
  const [sources, setSources] = useState({
    teams: [],
    players: [],
    referees: [],
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
        const [userList, teamList, playerList, refereeList] =
          await Promise.all([
            apiRequest("/api/users/", { signal: controller.signal }),
            apiRequest("/api/teams/", { signal: controller.signal }),
            apiRequest("/api/players/", { signal: controller.signal }),
            apiRequest("/api/referees/", { signal: controller.signal }),
          ]);

        if (
          !Array.isArray(userList) ||
          !Array.isArray(teamList) ||
          !Array.isArray(playerList) ||
          !Array.isArray(refereeList)
        ) {
          throw new Error("API response সঠিক নয়।");
        }

        if (!controller.signal.aborted) {
          setUsers(userList);
          setSources({
            teams: teamList,
            players: playerList,
            referees: refereeList,
          });
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

  function linkOptions(kind) {
    if (kind === "teams") {
      return sources.teams.map((team) => ({
        value: team.team_id,
        label: team.team_name,
      }));
    }

    if (kind === "players") {
      return sources.players.map((player) => ({
        value: player.player_id,
        label: `${player.name} (Team #${player.team})`,
      }));
    }

    return sources.referees.map((referee) => ({
      value: referee.referee_id,
      label: `${referee.name}${referee.email ? " — " + referee.email : ""}`,
    }));
  }

  function startEditing(user) {
    setEditingId(user.user_id);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: normalizeRole(user.role),
      team: String(user.team ?? ""),
      player: String(user.player ?? ""),
      referee: String(user.referee ?? ""),
    });
    setError("");
    setMessage("");
  }

  function linkPayload() {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
    };

    if (form.password) {
      payload.password = form.password;
    }

    payload.team = form.team === "" ? null : Number(form.team);
    payload.player = form.player === "" ? null : Number(form.player);
    payload.referee = form.referee === "" ? null : Number(form.referee);

    return payload;
  }

  function validate() {
    if (!form.name.trim()) {
      setError("Name দিতে হবে।");
      return false;
    }

    if (!form.email.trim()) {
      setError("Email দিতে হবে।");
      return false;
    }

    if (editingId === null && form.password.length < 8) {
      setError("Password কমপক্ষে ৮ অক্ষরের হতে হবে।");
      return false;
    }

    if (
      editingId !== null &&
      form.password !== "" &&
      form.password.length < 8
    ) {
      setError("Password কমপক্ষে ৮ অক্ষরের হতে হবে।");
      return false;
    }

    return true;
  }

  async function saveUser(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!validate()) return;

    setBusy(true);

    try {
      const isEditing = editingId !== null;

      await apiRequest(
        isEditing ? `/api/users/${editingId}/` : "/api/users/",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(linkPayload()),
        }
      );

      resetForm();
      setMessage(
        isEditing ? "User update হয়েছে।" : "নতুন user যোগ হয়েছে।"
      );
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(user) {
    if (!window.confirm(`"${user.email}" user মুছে ফেলতে চাও?`)) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/api/users/${user.user_id}/`, {
        method: "DELETE",
      });

      if (editingId === user.user_id) resetForm();

      setMessage("User মুছে ফেলা হয়েছে।");
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id="users">
      <div className="panel-header">
        <div>
          <h2>Users &amp; Roles</h2>
          <p>শুধু Admin: user তৈরি, role নির্ধারণ ও identity link।</p>
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
        <form className="team-form" onSubmit={saveUser}>
          <h3>{editingId !== null ? "Edit User" : "Add User"}</h3>

          <fieldset
            disabled={loading || busy}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
          >
            <div className="form-grid">
              <label>
                Name *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Email *
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  maxLength={150}
                  required
                />
              </label>

              <label>
                Password
                {editingId === null ? " (কমপক্ষে ৮ অক্ষর) *" : " (খালি = unchanged)"}
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required={editingId === null}
                />
              </label>

              <label>
                Role *
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  required
                >
                  {ALL_ROLES.map((roleKey) => (
                    <option key={roleKey} value={roleKey}>
                      {ROLE_LABELS[roleKey]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Team link {form.role === "team_manager" ? "*" : ""}
                <select
                  name="team"
                  value={form.team}
                  onChange={handleChange}
                >
                  <option value="">Select team</option>
                  {linkOptions("teams").map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Player link {form.role === "player" ? "*" : ""}
                <select
                  name="player"
                  value={form.player}
                  onChange={handleChange}
                >
                  <option value="">Select player</option>
                  {linkOptions("players").map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Referee link {form.role === "referee" ? "*" : ""}
                <select
                  name="referee"
                  value={form.referee}
                  onChange={handleChange}
                >
                  <option value="">Select referee</option>
                  {linkOptions("referees").map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="auth-hint">
              Team link → Team Manager, Player link → Player, Referee link →
              Referee. এগুলো object-level permission-এর ভিত্তি।
            </p>

            <div className="form-actions">
              <button type="submit" className="refresh-button" disabled={busy}>
                {busy
                  ? "Processing..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Add User"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                  disabled={busy}
                >
                  Cancel
                </button>
              )}
            </div>
          </fieldset>
        </form>

        {error && <p className="error-box" role="alert">{error}</p>}
        {message && (
          <p className="success-box" role="status">{message}</p>
        )}
      </div>

      {loading ? (
        <p className="empty-state">Users লোড হচ্ছে...</p>
      ) : users.length === 0 ? (
        <p className="empty-state">কোনো user নেই।</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Links</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const role = normalizeRole(user.role);

                const links = [
                  user.team ? `Team #${user.team}` : null,
                  user.player ? `Player #${user.player}` : null,
                  user.referee ? `Referee #${user.referee}` : null,
                ].filter(Boolean);

                return (
                  <tr key={user.user_id}>
                    <td>#{user.user_id}</td>
                    <td className="strong-cell">{user.name}</td>
                    <td>{user.email}</td>
                    <td>{ROLE_LABELS[role] || user.role}</td>
                    <td>{links.length ? links.join(", ") : "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="secondary-button"
                          disabled={busy}
                          onClick={() => startEditing(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="danger-button"
                          disabled={busy}
                          onClick={() => deleteUser(user)}
                        >
                          Delete
                        </button>
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
