import { useEffect, useState } from "react";

import { apiRequest } from "../services/api";

const configs = {
  "tournament-teams": {
    title: "Tournament Team Registration",
    fields: [
      { name: "tournament", label: "Tournament", source: "tournaments" },
      { name: "team", label: "Team", source: "teams" },
    ],
  },
  "match-teams": {
    title: "Match Teams",
    fields: [
      { name: "match", label: "Match", source: "matches" },
      { name: "team", label: "Team", source: "teams" },
      { name: "team_side", label: "Side", choices: ["Home", "Away"] },
    ],
  },
  "match-referees": {
    title: "Match Referees",
    fields: [
      { name: "match", label: "Match", source: "matches" },
      { name: "referee", label: "Referee", source: "referees" },
      { name: "role", label: "Role", choices: ["Main", "Asst."] },
    ],
  },
};

const sourceKeys = {
  tournaments: "tournament_id",
  teams: "team_id",
  matches: "match_id",
  referees: "referee_id",
};

function itemLabel(source, item) {
  if (source === "teams") return item.team_name;
  if (source === "matches") {
    return `Match #${item.match_id} — ${item.round || "Round নেই"} — ${
      item.match_date || "তারিখ নেই"
    }`;
  }
  return item.name;
}

async function request(url, options = {}) {
  return apiRequest(url, options);
}

export default function AssignmentsManager({ resource, onChanged, readOnly = false }) {
  const config = configs[resource];

  const emptyForm = () =>
    Object.fromEntries(config.fields.map((field) => [field.name, ""]));

  const [rows, setRows] = useState([]);
  const [sources, setSources] = useState({});
  const [form, setForm] = useState(emptyForm);
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
        const names = [
          ...new Set(
            config.fields.filter((field) => field.source)
              .map((field) => field.source)
          ),
        ];

        const [records, entries] = await Promise.all([
          request(`/api/${resource}/`, {
            signal: controller.signal,
          }),
          Promise.all(
            names.map(async (name) => [
              name,
              await request(`/api/${name}/`, {
                signal: controller.signal,
              }),
            ])
          ),
        ]);

        if (
          !Array.isArray(records) ||
          entries.some(([, items]) => !Array.isArray(items))
        ) {
          throw new Error("API response সঠিক নয়।");
        }

        if (!controller.signal.aborted) {
          setRows(records);
          setSources(Object.fromEntries(entries));
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadData();
    return () => controller.abort();
  }, [resource, config, reload]);

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
  }

  function editRecord(row) {
    setEditingId(row.id);
    setForm(
      Object.fromEntries(
        config.fields.map((field) => [
          field.name,
          String(row[field.name] ?? ""),
        ])
      )
    );
    setError("");
    setMessage("");
  }

  async function saveRecord(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = Object.fromEntries(
      config.fields.map((field) => [
        field.name,
        field.source ? Number(form[field.name]) : form[field.name],
      ])
    );

    if (config.fields.some((field) => !form[field.name])) {
      setError("সব field নির্বাচন করো।");
      return;
    }

    const otherRows = rows.filter((row) => row.id !== editingId);

    if (resource === "match-teams") {
      const sameMatch = otherRows.filter(
        (row) => row.match === payload.match
      );

      if (sameMatch.length >= 2) {
        setError("এই match-এ ইতিমধ্যে দুটি team আছে।");
        return;
      }

      if (
        sameMatch.some(
          (row) =>
            row.team === payload.team ||
            row.team_side === payload.team_side
        )
      ) {
        setError("একই match-এ একই team বা একই side দুবার দেওয়া যাবে না।");
        return;
      }
    }

    if (
      resource === "match-referees" &&
      otherRows.some(
        (row) =>
          row.match === payload.match &&
          row.referee === payload.referee
      )
    ) {
      setError("এই referee ইতিমধ্যে ওই match-এ assigned আছে।");
      return;
    }

    setBusy(true);

    try {
      await request(
        editingId !== null
          ? `/api/${resource}/${editingId}/`
          : `/api/${resource}/`,
        {
          method: editingId !== null ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      resetForm();
      setMessage("তথ্য সংরক্ষণ হয়েছে।");
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteRecord(row) {
    if (!window.confirm("এই assignment/registration মুছে ফেলবে?")) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await request(`/api/${resource}/${row.id}/`, {
        method: "DELETE",
      });

      if (editingId === row.id) resetForm();

      setMessage("Record মুছে ফেলা হয়েছে।");
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function displayValue(field, value) {
    if (!field.source) return value || "—";

    const item = (sources[field.source] || []).find(
      (entry) => entry[sourceKeys[field.source]] === value
    );

    return item ? itemLabel(field.source, item) : `#${value}`;
  }

  return (
    <section className="panel" id={resource}>
      <div className="panel-header">
        <h2>{config.title}</h2>
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
          <form className="team-form" onSubmit={saveRecord}>
            <h3>Read-only section</h3>
            <p>
              এই সেকশনে তুমি শুধু তথ্য দেখতে পারবে — তৈরি/পরিবর্তন/মুছে ফেলার
              অনুমতি নেই।
            </p>
          </form>
        ) : (
          <form className="team-form" onSubmit={saveRecord}>
          <h3>{editingId !== null ? "Edit Record" : "Add Record"}</h3>

          <fieldset
            disabled={loading || busy}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
          >
            <div className="form-grid">
              {config.fields.map((field) => (
                <label key={field.name}>
                  {field.label} *
                  <select
                    value={form[field.name]}
                    required
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        [field.name]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select {field.label}</option>

                    {field.choices
                      ? field.choices.map((choice) => (
                          <option key={choice} value={choice}>
                            {choice}
                          </option>
                        ))
                      : (sources[field.source] || []).map((item) => (
                          <option
                            key={item[sourceKeys[field.source]]}
                            value={item[sourceKeys[field.source]]}
                          >
                            {itemLabel(field.source, item)}
                          </option>
                        ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="form-actions">
              <button type="submit" className="refresh-button">
                {busy
                  ? "Processing..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Add"}
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
        <p className="empty-state">লোড হচ্ছে...</p>
      ) : rows.length === 0 ? (
        <p className="empty-state">কোনো record নেই।</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                {config.fields.map((field) => (
                  <th key={field.name}>{field.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>#{row.id}</td>

                  {config.fields.map((field) => (
                    <td key={field.name}>
                      {displayValue(field, row[field.name])}
                    </td>
                  ))}

                  <td>
                    <div className="row-actions">
                      {!readOnly && (
                        <>
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={busy}
                            onClick={() => editRecord(row)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="danger-button"
                            disabled={busy}
                            onClick={() => deleteRecord(row)}
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