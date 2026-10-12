import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import ErrorMessage from "./ErrorMessage.jsx";
import SlowServerNote from "./SlowServerNote.jsx";

const people = [
  { who: "aarav", name: "Aarav" },
  { who: "diya", name: "Diya" },
];

// two demo users, so the same board can be opened as two different people
export default function DemoButtons() {
  const { demoLogin } = useAuth();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function handleClick(who) {
    setBusy(who);
    setError("");
    try {
      await demoLogin(who);
    } catch (err) {
      setError(err.message);
      setBusy("");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-center gap-2">
        {people.map((person) => (
          <button
            key={person.who}
            className="btn btn-secondary"
            onClick={() => handleClick(person.who)}
            disabled={Boolean(busy)}
          >
            {busy === person.who
              ? "Opening the demo..."
              : `Try the demo as ${person.name}`}
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-slate-500">
        To see live updates, open the other one in a private window.
      </p>
      <ErrorMessage message={error} />
      <SlowServerNote waiting={Boolean(busy)} />
    </div>
  );
}
