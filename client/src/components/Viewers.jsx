import Avatar from "./Avatar.jsx";

// who is looking at this board right now
export default function Viewers({ viewers, userId, connected }) {
  if (!connected) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
        Reconnecting...
      </span>
    );
  }

  const names = viewers
    .map((viewer) => (viewer.id === userId ? "You" : viewer.name))
    .join(", ");

  return (
    <div
      className="flex items-center gap-2"
      aria-label={`Viewing now: ${names}`}
    >
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Live
      </span>
      <div className="flex -space-x-1.5">
        {viewers.map((viewer) => (
          <Avatar
            key={viewer.id}
            id={viewer.id}
            name={viewer.id === userId ? `${viewer.name} (you)` : viewer.name}
            ring
          />
        ))}
      </div>
    </div>
  );
}
