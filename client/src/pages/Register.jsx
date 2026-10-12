import { useState } from "react";
import { Link } from "react-router";
import ErrorMessage from "../components/ErrorMessage.jsx";
import SlowServerNote from "../components/SlowServerNote.jsx";
import { useAuth } from "../context/AuthContext.js";

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(name, email, password);
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
        <h1 className="mb-4 text-xl font-semibold">Create an account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="register-name">
              Name
            </label>
            <input
              id="register-name"
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              maxLength={50}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              At least 8 characters.
            </p>
          </div>
          <ErrorMessage message={error} />
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Creating account..." : "Sign up"}
          </button>
          <SlowServerNote waiting={busy} />
        </form>
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-indigo-700 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
