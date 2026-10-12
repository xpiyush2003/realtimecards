import { useState } from "react";
import ErrorMessage from "./ErrorMessage.jsx";

// rename a column, mark it as finished, or start deleting it
export default function ColumnForm({ column, onSave, onDelete, onCancel }) {
  const [name, setName] = useState(column.name);
  const [isDone, setIsDone] = useState(column.is_done);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave({ name, is_done: isDone });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="column-name">
          Column name
        </label>
        <input
          id="column-name"
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          required
          autoFocus
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={isDone}
          onChange={(event) => setIsDone(event.target.checked)}
        />
        <span>
          Cards here are finished
          <span className="block text-xs text-slate-500">
            Finished cards are never shown as overdue.
          </span>
        </span>
      </label>
      <ErrorMessage message={error} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-secondary mr-auto"
          onClick={onDelete}
        >
          Delete column
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
