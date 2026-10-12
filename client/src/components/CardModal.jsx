import { useEffect, useState } from "react";
import {
  addComment,
  deleteComment,
  getCard,
  updateCard,
} from "../api/boards.js";
import { formatDateTime } from "../utils/dates.js";
import { LABELS } from "../utils/labels.js";
import Avatar from "./Avatar.jsx";
import ErrorMessage from "./ErrorMessage.jsx";
import Modal from "./Modal.jsx";
import Spinner from "./Spinner.jsx";

// the popup for one card: its details on top, its comments below
export default function CardModal({
  boardId,
  cardId,
  members,
  user,
  isTeamOwner,
  version,
  onSaved,
  onCommented,
  onDelete,
  onClose,
}) {
  const [card, setCard] = useState(null);
  const [comments, setComments] = useState([]);
  // what is typed in the form, filled in once from the card
  const [form, setForm] = useState(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  // loads again whenever the board changes, so new comments show up
  useEffect(() => {
    let cancelled = false;
    getCard(boardId, cardId)
      .then((data) => {
        if (cancelled) return;
        setCard(data.card);
        setComments(data.comments);
        setForm(
          (old) =>
            old ?? {
              title: data.card.title,
              description: data.card.description,
              assignee_id: data.card.assignee_id ?? "",
              due_date: data.card.due_date ?? "",
              labels: data.card.labels,
            },
        );
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [boardId, cardId, version]);

  function change(field, value) {
    setForm((old) => ({ ...old, [field]: value }));
  }

  function toggleLabel(key) {
    const labels = form.labels.includes(key)
      ? form.labels.filter((label) => label !== key)
      : [...form.labels, key];
    change("labels", labels);
  }

  async function handleSave(event) {
    event.preventDefault();
    setBusy("save");
    setError("");
    try {
      await updateCard(boardId, cardId, {
        title: form.title,
        description: form.description,
        assignee_id: form.assignee_id === "" ? null : Number(form.assignee_id),
        due_date: form.due_date || null,
        labels: form.labels,
      });
      await onSaved();
    } catch (err) {
      setError(err.message);
      setBusy("");
    }
  }

  async function handleComment(event) {
    event.preventDefault();
    setBusy("comment");
    setError("");
    try {
      await addComment(boardId, cardId, comment);
      setComment("");
      await onCommented();
    } catch (err) {
      setError(err.message);
    }
    setBusy("");
  }

  async function handleDeleteComment(commentId) {
    setError("");
    try {
      await deleteComment(boardId, cardId, commentId);
      await onCommented();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal
      title={card ? `In ${card.column_name}` : "Card"}
      onClose={onClose}
      wide
    >
      {!form && !error && <Spinner />}
      {!form && <ErrorMessage message={error} />}

      {form && (
        <div className="space-y-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label" htmlFor="card-title">
                Title
              </label>
              <input
                id="card-title"
                className="input"
                value={form.title}
                onChange={(event) => change("title", event.target.value)}
                maxLength={120}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="card-description">
                Description
              </label>
              <textarea
                id="card-description"
                className="input"
                rows={3}
                value={form.description}
                onChange={(event) => change("description", event.target.value)}
                maxLength={2000}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="card-assignee">
                  Assignee
                </label>
                <select
                  id="card-assignee"
                  className="input"
                  value={form.assignee_id}
                  onChange={(event) =>
                    change("assignee_id", event.target.value)
                  }
                >
                  <option value="">Nobody</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="card-due">
                  Due date
                </label>
                <input
                  id="card-due"
                  type="date"
                  className="input"
                  value={form.due_date}
                  onChange={(event) => change("due_date", event.target.value)}
                />
              </div>
            </div>
            <div>
              <p className="label">Labels</p>
              <div className="flex flex-wrap gap-2">
                {LABELS.map((label) => {
                  const on = form.labels.includes(label.key);
                  return (
                    <button
                      key={label.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleLabel(label.key)}
                      className={`cursor-pointer rounded px-2 py-1 text-xs font-medium ${label.color} ${on ? "ring-2 ring-indigo-500" : "opacity-50"}`}
                    >
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <ErrorMessage message={error} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary mr-auto"
                onClick={() => onDelete(card)}
              >
                Delete card
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button className="btn btn-primary" disabled={busy === "save"}>
                {busy === "save" ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          <section className="border-t border-slate-100 pt-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">
              Comments ({comments.length})
            </h3>
            <ul className="space-y-3">
              {comments.map((item) => (
                <li key={item.id} className="flex gap-2">
                  <Avatar id={item.user_id} name={item.user_name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-800">
                        {item.user_name}
                      </span>
                      {" · "}
                      {formatDateTime(item.created_at)}
                      {(item.user_id === user.id || isTeamOwner) && (
                        <button
                          className="ml-2 cursor-pointer text-slate-500 underline hover:text-red-700"
                          onClick={() => handleDeleteComment(item.id)}
                        >
                          Delete
                        </button>
                      )}
                    </p>
                    <p className="text-sm break-words whitespace-pre-wrap text-slate-800">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <form onSubmit={handleComment} className="mt-3 flex gap-2">
              <input
                className="input"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Write a comment"
                aria-label="Write a comment"
                maxLength={1000}
                required
              />
              <button
                className="btn btn-secondary shrink-0"
                disabled={busy === "comment"}
              >
                {busy === "comment" ? "Sending..." : "Comment"}
              </button>
            </form>
          </section>
        </div>
      )}
    </Modal>
  );
}
