import { useEffect, useState } from "react";

import { apiRequest } from "../services/api";

const emptyForm = {
  team_name: "",
  coach_name: "",
  contact_info: "",
};

export default function TeamsManager({ onChanged, readOnly = false, ownTeamId = null }) {
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTeams() {
      setLoading(true);
      setError("");

      try {
        const data = await apiRequest("/api/teams/", {
          signal: controller.signal,
        });

        if (!Array.isArray(data)) {
          throw new Error("Teams response সঠিক নয়।");
        }

        if (!controller.signal.aborted) {
          setTeams(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadTeams();

    return () => controller.abort();
  }, [reload]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  function startEditing(team) {
    setEditingId(team.team_id);
    setForm({
      team_name: team.team_name || "",
      coach_name: team.coach_name || "",
      contact_info: team.contact_info || "",
    });
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      team_name: form.team_name.trim(),
      coach_name: form.coach_name.trim(),
      contact_info: form.contact_info.trim(),
    };

    if (!payload.team_name) {
      setError("Team name লিখতে হবে।");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const isEditing = editingId !== null;

      await apiRequest(
        isEditing ? `/api/teams/${editingId}/` : "/api/teams/",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      resetForm();
      setMessage(
        isEditing
          ? "Team সফলভাবে update হয়েছে।"
          : "নতুন team যোগ হয়েছে।"
      );
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteTeam(team) {
    const confirmed = window.confirm(
      `"${team.team_name}" team মুছে ফেলতে চাও?`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/api/teams/${team.team_id}/`, {
        method: "DELETE",
      });

      if (editingId === team.team_id) {
        resetForm();
      }

      setMessage("Team মুছে ফেলা হয়েছে।");
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id="teams">
      <div className="panel-header">
        <div>
          <h2>Teams Management</h2>
          <p>নতুন team যোগ, পরিবর্তন ও মুছে ফেলো।</p>
        </div>

        <button
          type="button"
          className="secondary-button"
          disabled={busy}
          onClick={() => setReload((value) => value + 1)}
        >
          Refresh
        </button>
      </div>

      <div className="manager-body">
        {readOnly ? (
          <form className="team-form" onSubmit={handleSubmit}>
            <h3>Read-only section</h3>
            <p>
              এই সেকশনে তুমি শুধু তথ্য দেখতে পারবে — তৈরি/পরিবর্তন/মুছে ফেলার
              অনুমতি নেই।
            </p>
          </form>
        ) : (
          <form className="team-form" onSubmit={handleSubmit}>
          <h3>
            {editingId !== null ? "Edit Team" : "Add New Team"}
          </h3>

          <div className="form-grid">
            <label>
              Team name *
              <input
                name="team_name"
                value={form.team_name}
                onChange={handleChange}
                maxLength={100}
                required
                disabled={busy}
                placeholder="যেমন: Sylhet Warriors"
              />
            </label>

            <label>
              Coach name
              <input
                name="coach_name"
                value={form.coach_name}
                onChange={handleChange}
                maxLength={100}
                disabled={busy}
                placeholder="কোচের নাম"
              />
            </label>

            <label>
              Contact information
              <input
                name="contact_info"
                value={form.contact_info}
                onChange={handleChange}
                maxLength={150}
                disabled={busy}
                placeholder="ফোন বা ইমেইল"
              />
            </label>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="refresh-button"
              disabled={busy}
            >
              {busy
                ? "Processing..."
                : editingId !== null
                  ? "Save Changes"
                  : "Add Team"}
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
        </form>
        )}

        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="success-box" role="status">
            {message}
          </p>
        )}
      </div>

      {loading ? (
        <p className="empty-state">Teams লোড হচ্ছে...</p>
      ) : teams.length === 0 ? (
        <p className="empty-state">কোনো team পাওয়া যায়নি।</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Team</th>
                <th>Coach</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {teams.map((team) => (
                <tr key={team.team_id}>
                  <td>#{team.team_id}</td>
                  <td className="strong-cell">{team.team_name}</td>
                  <td>{team.coach_name || "—"}</td>
                  <td>{team.contact_info || "—"}</td>
                  <td>
                    <div className="row-actions">
                      {!readOnly &&
                        (ownTeamId === null ||
                          team.team_id === ownTeamId) && (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => startEditing(team)}
                            disabled={busy}
                          >
                            Edit
                          </button>
                        )}

                      {!readOnly && ownTeamId === null && (
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => deleteTeam(team)}
                          disabled={busy}
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