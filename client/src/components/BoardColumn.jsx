import { Draggable, Droppable } from "@hello-pangea/dnd";
import { useState } from "react";
import CardTile from "./CardTile.jsx";

// the box at the bottom of a column for adding a card quickly
function AddCard({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    const saved = await onAdd(title);
    setBusy(false);
    if (saved) setTitle("");
  }

  if (!open) {
    return (
      <button
        className="w-full cursor-pointer rounded-lg px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-200"
        onClick={() => setOpen(true)}
      >
        + Add a card
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        className="input"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Card title"
        aria-label="Card title"
        maxLength={120}
        required
        autoFocus
      />
      <div className="flex gap-2">
        <button className="btn btn-primary btn-small" disabled={busy}>
          {busy ? "Adding..." : "Add card"}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function BoardColumn({
  column,
  today,
  onOpenCard,
  onAddCard,
  onEdit,
}) {
  return (
    <section className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-100 p-2">
      <div className="flex items-center gap-2 px-1 pb-2">
        <h2 className="min-w-0 truncate text-sm font-semibold text-slate-800">
          {column.name}
        </h2>
        <span className="text-xs text-slate-500">{column.cards.length}</span>
        {column.is_done && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            Finished
          </span>
        )}
        <button
          className="ml-auto cursor-pointer rounded px-2 py-0.5 text-slate-500 hover:bg-slate-200"
          onClick={() => onEdit(column)}
          aria-label={`Edit column ${column.name}`}
        >
          ⋯
        </button>
      </div>

      <Droppable droppableId={String(column.id)}>
        {(drop, dropState) => (
          <div
            ref={drop.innerRef}
            {...drop.droppableProps}
            className={`min-h-12 rounded-lg ${dropState.isDraggingOver ? "bg-indigo-100" : ""}`}
          >
            {column.cards.map((card, index) => (
              <Draggable
                key={card.id}
                draggableId={String(card.id)}
                index={index}
              >
                {(drag, dragState) => (
                  <div
                    ref={drag.innerRef}
                    {...drag.draggableProps}
                    {...drag.dragHandleProps}
                    className="mb-2"
                    onClick={() => onOpenCard(card)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") onOpenCard(card);
                    }}
                  >
                    <CardTile
                      card={card}
                      today={today}
                      finished={column.is_done}
                      dragging={dragState.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {drop.placeholder}
          </div>
        )}
      </Droppable>

      <AddCard onAdd={(title) => onAddCard(column, title)} />
    </section>
  );
}
