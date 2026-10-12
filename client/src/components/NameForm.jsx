import { useState } from "react";
import ErrorMessage from "./ErrorMessage.jsx";

// a form with one name box, used for teams, boards and new columns
export default function NameForm({
  label,
  start = "",
  maxLength = 60,
  saveLabel,
  onSave,
  onCancel,
}) {
  const [name, setName] = useState(start);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(name);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="name-box">
          {label}
        </label>
        <input
          id="name-box"
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={maxLength}
          required
          autoFocus
        />
      </div>
      <ErrorMessage message={error} />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Saving..." : saveLabel}
        </button>
      </div>
    </form>
  );
}
