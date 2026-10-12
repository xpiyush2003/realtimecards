// the fixed set of labels a card can have
export const LABELS = [
  { key: "bug", name: "Bug", color: "bg-red-100 text-red-800" },
  { key: "feature", name: "Feature", color: "bg-sky-100 text-sky-800" },
  { key: "design", name: "Design", color: "bg-purple-100 text-purple-800" },
  { key: "research", name: "Research", color: "bg-teal-100 text-teal-800" },
  { key: "urgent", name: "Urgent", color: "bg-amber-100 text-amber-800" },
  { key: "chore", name: "Chore", color: "bg-slate-200 text-slate-700" },
];

// "Aarav Mehta" -> "AM"
export function initials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-indigo-600",
  "bg-emerald-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-sky-600",
  "bg-purple-600",
];

// the same person always gets the same colour
export function avatarColor(userId) {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length];
}
