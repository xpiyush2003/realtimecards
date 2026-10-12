import { Link, NavLink, Outlet, useMatch } from "react-router";
import { useAuth } from "../context/AuthContext.js";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/teams", label: "Teams" },
];

function linkClass({ isActive }) {
  const base = "rounded-lg px-3 py-1.5 text-sm font-medium";
  return isActive
    ? `${base} bg-indigo-50 text-indigo-700`
    : `${base} text-slate-600 hover:bg-slate-100`;
}

export default function Layout() {
  const { user, logout } = useAuth();
  // a board needs the whole width of the screen
  const onBoard = useMatch("/boards/:id");
  const width = onBoard ? "" : "mx-auto max-w-5xl";

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div
          className={`${width} flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3`}
        >
          <Link to="/dashboard" className="text-lg font-bold text-indigo-700">
            RealTimeCards
          </Link>
          <nav className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-600">
              {user.name}
              {user.is_demo && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  Demo
                </span>
              )}
            </span>
            <button className="btn btn-secondary btn-small" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className={`${width} px-4 py-6`}>
        <Outlet />
      </main>
    </div>
  );
}
