import { useEffect, useState } from "react";

import { apiRequest } from "../services/api";
import { normalizeRole, ROLES } from "../services/roles";

const emptyForm = {
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  organized_by: "",
};

export default function TournamentsManager({
  onChanged,
  readOnly = false,
  role = null,
  currentUserId = null,
}) {
  const isAdmin = normalizeRole(role) === ROLES.admin;

  const [tournaments, setTournaments] = useState([]);
  const [users, setUsers] = useState([]);
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
        const jobs = [
          apiRequest("/api/tournaments/", {
            signal: controller.signal,
          }),
        ];

        // The users list is an admin-only endpoint; only admins may pick
        // a specific organizer. Everyone else's organizer is set
        // server-side (the logged-in organizer themselves).
        if (isAdmin) {
          jobs.push(
            apiRequest("/api/users/", { signal: controller.signal })
          );
        }

        const [tournamentData, userData] = await Promise.all(jobs);

        if (!Array.isArray(tournamentData)) {
          throw new Error("API response সঠিক নয়।");
        }

        if (!controller.signal.aborted) {
          setTournaments(tournamentData);
          setUsers(Array.isArray(userData) ? userData : []);
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadData();

    return () => controller.abort();
  }, [reload, isAdmin]);

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function editTournament(tournament) {
    setEditingId(tournament.tournament_id);
    setForm({
      name: tournament.name || "",
      description: tournament.description || "",
      start_date: tournament.start_date || "",
      end_date: tournament.end_date || "",
      organized_by: String(tournament.organized_by ?? ""),
    });
    setError("");
    setMessage("");
  }

  async function saveTournament(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.name.trim()) {
      setError("Tournament name দিতে হবে।");
      return;
    }

    if (isAdmin && !form.organized_by) {
      setError("Admin হিসেবে organizer নির্বাচন করো।");
      return;
    }

    if (
      form.start_date &&
      form.end_date &&
      form.end_date < form.start_date
    ) {
      setError("End date, start date-এর আগে হতে পারবে না।");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };

    // Only admins may choose an organizer; organizers get themselves
    // assigned server-side, never trust the client value.
    if (isAdmin && form.organized_by) {
      payload.organized_by = Number(form.organized_by);
    }

    setBusy(true);

    try {
      const isEditing = editingId !== null;

      await apiRequest(
        isEditing
          ? `/api/tournaments/${editingId}/`
          : "/api/tournaments/",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      resetForm();
      setMessage(
        isEditing
          ? "Tournament update হয়েছে।"
          : "নতুন tournament তৈরি হয়েছে।"
      );
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteTournament(tournament) {
    if (!window.confirm(`"${tournament.name}" মুছে ফেলতে চাও?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        `/api/tournaments/${tournament.tournament_id}/`,
        { method: "DELETE" }
      );

      if (editingId === tournament.tournament_id) resetForm();

      setMessage("Tournament মুছে ফেলা হয়েছে।");
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function tournamentOrganizer(tournament) {
    if (tournament.organizer_name) return tournament.organizer_name;

    const match = users.find(
      (user) => user.user_id === tournament.organized_by
    );

    return match ? match.name : `User #${tournament.organized_by}`;
  }

  function canManageRow(tournament) {
    // Object-level ownership is enforced by the backend too; the UI
    // mirrors it: admins manage everything, organizers only rows they
    // themselves organize (organized_by === currentUserId).
    if (readOnly) return false;

    if (isAdmin) return true;

    return (
      normalizeRole(role) === ROLES.organizer &&
      currentUserId !== null &&
      tournament.organized_by === currentUserId
    );
  }

  return (
    <section className="panel" id="tournaments">
      <div className="panel-header">
        <div>
          <h2>Tournaments Management</h2>
          <p>Tournament ও organizer-এর তথ্য পরিচালনা করো।</p>
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
          <form className="team-form" onSubmit={saveTournament}>
            <h3>Read-only section</h3>
            <p>
              এই সেকশনে তুমি শুধু তথ্য দেখতে পারবে — তৈরি/পরিবর্তন/মুছে ফেলার
              অনুমতি নেই।
            </p>
          </form>
        ) : (
          <form className="team-form" onSubmit={saveTournament}>
          <h3>
            {editingId !== null ? "Edit Tournament" : "Add Tournament"}
          </h3>

          <fieldset
            disabled={loading || busy}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
          >
            <div className="form-grid">
              <label>
                Tournament name *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={150}
                  required
                />
              </label>

              {isAdmin && (
                <label>
                  Organizer *
                  <select
                    name="organized_by"
                    value={form.organized_by}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select organizer</option>
                    {users.map((user) => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.name} (#{user.user_id})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Start date
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                />
              </label>

              <label>
                End date
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  min={form.start_date || undefined}
                  onChange={handleChange}
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                />
              </label>
            </div>

            {!isAdmin && (
              <p>Tournament-এর organizer স্বয়ংক্রিয়ভাবে তুমি হবে।</p>
            )}

            <div className="form-actions">
              <button type="submit" className="refresh-button">
                {busy
                  ? "Processing..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Add Tournament"}
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
      </div>

      {loading ? (
        <p className="empty-state">Tournaments লোড হচ্ছে...</p>
      ) : tournaments.length === 0 ? (
        <p className="empty-state">কোনো tournament নেই।</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Organizer</th>
                <th>Start</th>
                <th>End</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((tournament) => (
                <tr key={tournament.tournament_id}>
                  <td className="strong-cell">{tournament.name}</td>
                  <td>{tournamentOrganizer(tournament)}</td>
                  <td>{tournament.start_date || "—"}</td>
                  <td>{tournament.end_date || "—"}</td>
                  <td>
                    <div className="row-actions">
                      {canManageRow(tournament) && (
                        <button
                          className="secondary-button"
                          disabled={busy}
                          onClick={() => editTournament(tournament)}
                        >
                          Edit
                        </button>
                      )}
                      {canManageRow(tournament) && (
                        <button
                          className="danger-button"
                          disabled={busy}
                          onClick={() => deleteTournament(tournament)}
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
