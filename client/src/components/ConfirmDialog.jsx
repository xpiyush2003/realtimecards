import { useState } from "react";
import ErrorMessage from "./ErrorMessage.jsx";
import Modal from "./Modal.jsx";

// asks before doing something that cannot be undone
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-600">{message}</p>
      <ErrorMessage message={error} />
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-danger"
          onClick={handleConfirm}
          disabled={busy}
        >
          {busy ? "Please wait..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
