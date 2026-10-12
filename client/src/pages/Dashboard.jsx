import { Link } from "react-router";
import { getDashboard } from "../api/teams.js";
import { DueBadge } from "../components/CardTile.jsx";
import { DueChart, StatusChart } from "../components/Charts.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import Spinner from "../components/Spinner.jsx";
import { useAuth } from "../context/AuthContext.js";
import { useApi } from "../utils/useApi.js";

function SummaryCard({ label, value, color = "text-slate-900" }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, error, loading } = useApi(getDashboard);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  const { totals } = data;
  const hasCards = data.by_status.length > 0;
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hi, {firstName}</h1>
        <p className="text-sm text-slate-600">
          The cards assigned to you, across all your teams.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Open cards" value={totals.open} />
        <SummaryCard label="Due in the next 7 days" value={totals.due_soon} />
        <SummaryCard
          label="Overdue"
          value={totals.overdue}
          color={totals.overdue > 0 ? "text-red-600" : "text-slate-900"}
        />
        <SummaryCard label="Finished" value={totals.finished} />
      </div>

      {!hasCards ? (
        <div className="card text-center">
          <p className="font-medium">No cards are assigned to you yet</p>
          <p className="mt-1 text-sm text-slate-600">
            Open a board and assign yourself a card to see it here.
          </p>
          <Link to="/teams" className="btn btn-primary mt-4">
            Go to teams
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card">
              <h2 className="font-semibold">My cards by status</h2>
              <p className="mb-4 text-xs text-slate-500">
                The column each of my cards is in
              </p>
              <StatusChart data={data.by_status} />
            </section>
            <section className="card">
              <h2 className="font-semibold">Due in the next 7 days</h2>
              <p className="mb-4 text-xs text-slate-500">
                My open cards, by due date
              </p>
              <DueChart data={data.due_by_day} today={data.today} />
            </section>
          </div>

          <section className="card">
            <h2 className="mb-2 font-semibold">Overdue and due soon</h2>
            {data.due_cards.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Nothing is overdue or due in the next 7 days.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.due_cards.map((card) => (
                  <li key={card.id}>
                    <Link
                      to={`/boards/${card.board_id}`}
                      className="flex items-center gap-3 py-2.5 hover:text-indigo-700"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {card.title}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {card.board_name} · {card.column_name}
                        </span>
                      </span>
                      <DueBadge
                        date={card.due_date}
                        today={data.today}
                        finished={false}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
