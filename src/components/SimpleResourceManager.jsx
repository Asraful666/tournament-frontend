import { useEffect, useState } from "react";

import { apiRequest } from "../services/api";

const configs = {
  venues: {
    title: "Venues",
    key: "venue_id",
    nameField: "venue_name",
    fields: [
      {
        name: "venue_name",
        label: "Venue name",
        required: true,
        maxLength: 150,
      },
      {
        name: "location",
        label: "Location",
        maxLength: 255,
      },
      {
        name: "capacity",
        label: "Capacity",
        type: "number",
      },
    ],
  },

  referees: {
    title: "Referees",
    key: "referee_id",
    nameField: "name",
    fields: [
      {
        name: "name",
        label: "Name",
        required: true,
        maxLength: 100,
      },
      {
        name: "phone",
        label: "Phone",
        type: "tel",
        maxLength: 30,
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        maxLength: 150,
      },
    ],
  },
};

async function request(url, options = {}) {
  return apiRequest(url, options);
}

export default function SimpleResourceManager({ resource, onChanged, readOnly = false }) {
  const config = configs[resource];

  // App-এ resource হিসেবে "venues" বা "referees" ব্যবহার করবে।
  const makeEmptyForm = () =>
    Object.fromEntries(config.fields.map((field) => [field.name, ""]));

  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(makeEmptyForm);
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
        const data = await request(`/api/${resource}/`, {
          signal: controller.signal,
        });

        if (!Array.isArray(data)) {
          throw new Error("API response সঠিক নয়।");
        }

        if (!controller.signal.aborted) setRows(data);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadData();
    return () => controller.abort();
  }, [resource, reload]);

  function resetForm() {
    setForm(makeEmptyForm());
    setEditingId(null);
  }

  function editRecord(row) {
    setEditingId(row[config.key]);

    setForm(
      Object.fromEntries(
        config.fields.map((field) => [
          field.name,
          row[field.name] ?? "",
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

    const payload = {};

    for (const field of config.fields) {
      const value = String(form[field.name]).trim();

      if (field.required && !value) {
        setError(`${field.label} দিতে হবে।`);
        return;
      }

      if (field.type === "number") {
        if (
          value !== "" &&
          (!Number.isInteger(Number(value)) ||
            Number(value) < 0 ||
            Number(value) > 2147483647)
        ) {
          setError(`${field.label} একটি বৈধ অঋণাত্মক পূর্ণসংখ্যা হবে।`);
          return;
        }

        payload[field.name] = value === "" ? null : Number(value);
      } else {
        payload[field.name] = value;
      }
    }

    setBusy(true);

    try {
      const isEditing = editingId !== null;

      await request(
        isEditing
          ? `/api/${resource}/${editingId}/`
          : `/api/${resource}/`,
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      resetForm();
      setMessage(
        isEditing ? "তথ্য update হয়েছে।" : "নতুন record যোগ হয়েছে।"
      );
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteRecord(row) {
    if (
      !window.confirm(`"${row[config.nameField]}" মুছে ফেলতে চাও?`)
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await request(`/api/${resource}/${row[config.key]}/`, {
        method: "DELETE",
      });

      if (editingId === row[config.key]) resetForm();

      setMessage("Record মুছে ফেলা হয়েছে।");
      setReload((value) => value + 1);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={resource}>
      <div className="panel-header">
        <div>
          <h2>{config.title} Management</h2>
          <p>তথ্য যোগ, পরিবর্তন ও মুছে ফেলো।</p>
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
          <form className="team-form" onSubmit={saveRecord}>
            <h3>Read-only section</h3>
            <p>
              এই সেকশনে তুমি শুধু তথ্য দেখতে পারবে — তৈরি/পরিবর্তন/মুছে ফেলার
              অনুমতি নেই।
            </p>
          </form>
        ) : (
          <form className="team-form" onSubmit={saveRecord}>
          <h3>
            {editingId !== null ? "Edit Record" : "Add New Record"}
          </h3>

          <fieldset
            disabled={loading || busy}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
          >
            <div className="form-grid">
              {config.fields.map((field) => (
                <label key={field.name}>
                  {field.label} {field.required ? "*" : ""}
                  <input
                    name={field.name}
                    type={field.type || "text"}
                    value={form[field.name]}
                    required={field.required}
                    maxLength={field.maxLength}
                    min={field.type === "number" ? 0 : undefined}
                    max={
                      field.type === "number"
                        ? 2147483647
                        : undefined
                    }
                    step={field.type === "number" ? 1 : undefined}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        [field.name]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </div>

            <div className="form-actions">
              <button type="submit" className="refresh-button">
                {busy
                  ? "Processing..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Add Record"}
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
                <tr key={row[config.key]}>
                  <td>#{row[config.key]}</td>

                  {config.fields.map((field) => (
                    <td key={field.name}>
                      {row[field.name] === null ||
                      row[field.name] === ""
                        ? "—"
                        : row[field.name]}
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