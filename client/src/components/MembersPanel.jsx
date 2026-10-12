import { useState } from "react";
import Avatar from "./Avatar.jsx";
import ErrorMessage from "./ErrorMessage.jsx";

export default function MembersPanel({ team, members, user, onAdd, onRemove }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isOwner = team.owner_id === user.id;

  async function handleAdd(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onAdd(email);
      setEmail("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <ul className="divide-y divide-slate-100">
        {members.map((member) => {
          const isMe = member.id === user.id;
          const isTeamOwner = member.id === team.owner_id;
          return (
            <li key={member.id} className="flex items-center gap-3 py-3">
              <Avatar id={member.id} name={member.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {member.name}
                  {isMe && " (you)"}
                  {isTeamOwner && (
                    <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                      Owner
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {member.email}
                </p>
              </div>
              {!isTeamOwner && (isOwner || isMe) && (
                <button
                  className="btn btn-secondary btn-small shrink-0"
                  onClick={() => onRemove(member)}
                >
                  {isMe ? "Leave team" : "Remove"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {isOwner && (
        <form onSubmit={handleAdd} className="space-y-2">
          <label className="label" htmlFor="member-email">
            Add someone by email
          </label>
          <div className="flex gap-2">
            <input
              id="member-email"
              type="email"
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@example.com"
              required
            />
            <button className="btn btn-primary shrink-0" disabled={busy}>
              {busy ? "Adding..." : "Add"}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            {user.is_demo
              ? "In the demo you can only add the other demo people, for example meera@realtimecards.app or rohan@realtimecards.app."
              : "They need to have a RealTimeCards account already."}
          </p>
          <ErrorMessage message={error} />
        </form>
      )}
    </div>
  );
}
