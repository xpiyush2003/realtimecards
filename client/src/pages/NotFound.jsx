import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-sm px-4 py-24 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        The page you are looking for does not exist.
      </p>
      <Link to="/" className="btn btn-primary mt-6">
        Go home
      </Link>
    </div>
  );
}
