import { useState } from "react";
import { Link } from "react-router";
import DemoButtons from "../components/DemoButtons.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import SlowServerNote from "../components/SlowServerNote.jsx";
import { useAuth } from "../context/AuthContext.js";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <Link
        to="/"
        className="block text-center text-lg font-bold text-indigo-700"
      >
        RealTimeCards
      </Link>
      <div className="card mt-6">
        <h1 className="mb-4 text-xl font-semibold">Log in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <ErrorMessage message={error} />
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Logging in..." : "Log in"}
          </button>
          <SlowServerNote waiting={busy} />
        </form>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <DemoButtons />
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">
        New here?{" "}
        <Link
          to="/register"
          className="font-medium text-indigo-700 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
