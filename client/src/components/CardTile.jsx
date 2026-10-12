import { formatDate } from "../utils/dates.js";
import { LABELS } from "../utils/labels.js";
import Avatar from "./Avatar.jsx";

// a due date is red when it has passed and the card is not finished
export function DueBadge({ date, today, finished }) {
  let color = "bg-slate-100 text-slate-600";
  let text = formatDate(date);
  if (!finished && date < today) {
    color = "bg-red-100 text-red-700";
    text = `Overdue · ${text}`;
  } else if (!finished && date === today) {
    color = "bg-amber-100 text-amber-800";
    text = "Due today";
  }
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${color}`}>
      {text}
    </span>
  );
}

export function LabelChips({ labels }) {
  const shown = LABELS.filter((label) => labels.includes(label.key));
  if (shown.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((label) => (
        <span
          key={label.key}
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${label.color}`}
        >
          {label.name}
        </span>
      ))}
    </div>
  );
}

// the small card shown in a column
export default function CardTile({ card, today, finished, dragging }) {
  return (
    <div
      className={`space-y-2 rounded-lg border bg-white p-3 shadow-sm ${dragging ? "border-indigo-400 shadow-lg" : "border-slate-200 hover:border-indigo-300"}`}
    >
      <LabelChips labels={card.labels} />
      <p className="text-sm font-medium break-words text-slate-900">
        {card.title}
      </p>
      {(card.due_date || card.comment_count > 0 || card.assignee_id) && (
        <div className="flex items-center gap-2">
          {card.due_date && (
            <DueBadge date={card.due_date} today={today} finished={finished} />
          )}
          {card.comment_count > 0 && (
            <span className="text-xs text-slate-500">
              {card.comment_count}{" "}
              {card.comment_count === 1 ? "comment" : "comments"}
            </span>
          )}
          {card.assignee_id && (
            <span className="ml-auto">
              <Avatar id={card.assignee_id} name={card.assignee_name} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
