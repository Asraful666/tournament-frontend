import { useEffect, useState } from "react";

import { apiRequest } from "../services/api";

const emptyForm = {
  tournament: "",
  venue: "",
  match_date: "",
  match_time: "",
  round: "",
};

export default function MatchesManager({ onChanged, readOnly = false }) {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [venues, setVenues] = useState([]);
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
        const [matchData, tournamentData, venueData] =
          await Promise.all([
            apiRequest("/api/matches/", {
              signal: controller.signal,
            }),
            apiRequest("/api/tournaments/", {
              signal: controller.signal,
            }),
            apiRequest("/api/venues/", {
              signal: controller.signal,
            }),
          ]);

        if (
          !Array.isArray(matchData) ||
          !Array.isArray(tournamentData) ||
          !Array.isArray(venueData)
        ) {
          throw new Error("API response সঠিক নয়।");
        }

        if (!controller.signal.aborted) {
          setMatches(matchData);
          setTournaments(tournamentData);
          setVenues(venueData);
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

  function editMatch(match) {
    setEditingId(match.match_id);
    setForm({
      tournament: String(match.tournament),
      venue: String(match.venue),
      match_date: match.match_date || "",
      match_time: match.match_time || "",
      round: match.round || "",
    });
    setError("");
    setMessage("");
  }

  async function saveMatch(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.tournament || !form.venue) {
      setError("Tournament ও venue নির্বাচন করো।");
      return;
    }

    setBusy(true);

    try {
      const isEditing = editingId !== null;

      await apiRequest(
        isEditing ? `/api/matches/${editingId}/` : "/api/matches/",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify({
            tournament: Number(form.tournament),
            venue: Number(form.venue),
            match_date: form.match_date || null,
            match_time: form.match_time || null,
            round: form.round.trim(),
          }),
        }
      );

      resetForm();
      setMessage(
        isEditing ? "Match update হয়েছে।" : "নতুন match তৈরি হয়েছে।"
      );
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteMatch(match) {
    if (!window.confirm(`Match #${match.match_id} মুছে ফেলতে চাও?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/api/matches/${match.match_id}/`, {
        method: "DELETE",
      });

      if (editingId === match.match_id) resetForm();

      setMessage("Match মুছে ফেলা হয়েছে।");
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const tournamentNames = new Map(
    tournaments.map((item) => [item.tournament_id, item.name])
  );

  const venueNames = new Map(
    venues.map((item) => [item.venue_id, item.venue_name])
  );

  return (
    <section className="panel" id="matches">
      <div className="panel-header">
        <div>
          <h2>Matches Management</h2>
          <p>Match-এর tournament, venue ও সময় নির্ধারণ করো।</p>
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
          <form className="team-form" onSubmit={saveMatch}>
            <h3>Read-only section</h3>
            <p>
              এই সেকশনে তুমি শুধু তথ্য দেখতে পারবে — তৈরি/পরিবর্তন/মুছে ফেলার
              অনুমতি নেই।
            </p>
          </form>
        ) : (
          <form className="team-form" onSubmit={saveMatch}>
          <h3>
            {editingId !== null ? "Edit Match" : "Add Match"}
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
                  {tournaments.map((item) => (
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
                Venue *
                <select
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select venue</option>
                  {venues.map((item) => (
                    <option key={item.venue_id} value={item.venue_id}>
                      {item.venue_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Match date
                <input
                  type="date"
                  name="match_date"
                  value={form.match_date}
                  onChange={handleChange}
                />
              </label>

              <label>
                Match time
                <input
                  type="time"
                  name="match_time"
                  value={form.match_time}
                  onChange={handleChange}
                  step="1"
                />
              </label>

              <label>
                Round
                <input
                  name="round"
                  value={form.round}
                  onChange={handleChange}
                  maxLength={50}
                  placeholder="যেমন: Semi Final"
                />
              </label>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="refresh-button"
                disabled={
                  tournaments.length === 0 || venues.length === 0
                }
              >
                {busy
                  ? "Processing..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Add Match"}
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

          {!loading &&
            (tournaments.length === 0 || venues.length === 0) && (
              <p>Match তৈরির আগে tournament ও venue থাকতে হবে।</p>
            )}
        </form>
        )}

        {error && <p className="error-box" role="alert">{error}</p>}
        {message && (
          <p className="success-box" role="status">{message}</p>
        )}
      </div>

      {loading ? (
        <p className="empty-state">Matches লোড হচ্ছে...</p>
      ) : matches.length === 0 ? (
        <p className="empty-state">কোনো match নেই।</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tournament</th>
                <th>Venue</th>
                <th>Date</th>
                <th>Time</th>
                <th>Round</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {matches.map((match) => (
                <tr key={match.match_id}>
                  <td>#{match.match_id}</td>
                  <td>
                    {tournamentNames.get(match.tournament) ||
                      `Tournament #${match.tournament}`}
                  </td>
                  <td>
                    {venueNames.get(match.venue) ||
                      `Venue #${match.venue}`}
                  </td>
                  <td>{match.match_date || "—"}</td>
                  <td>{match.match_time || "—"}</td>
                  <td>{match.round || "—"}</td>
                  <td>
                    <div className="row-actions">
                      {!readOnly && (
                        <>
                          <button
                            className="secondary-button"
                            disabled={busy}
                            onClick={() => editMatch(match)}
                          >
                            Edit
                          </button>
                          <button
                            className="danger-button"
                            disabled={busy}
                            onClick={() => deleteMatch(match)}
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