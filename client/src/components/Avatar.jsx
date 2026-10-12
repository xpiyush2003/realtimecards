import { avatarColor, initials } from "../utils/labels.js";

// a small circle with a person's initials
export default function Avatar({ id, name, ring = false }) {
  return (
    <span
      title={name}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor(id)} ${ring ? "ring-2 ring-white" : ""}`}
    >
      {initials(name)}
    </span>
  );
}
