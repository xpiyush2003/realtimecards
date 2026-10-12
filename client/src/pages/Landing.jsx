import { Link } from "react-router";
import DemoButtons from "../components/DemoButtons.jsx";

const features = [
  {
    title: "Boards for your team",
    text: "Make a board for each project, with columns for every stage and a card for every task.",
  },
  {
    title: "Live for everyone",
    text: "When a teammate moves or edits a card, it changes on your screen straight away. No refreshing.",
  },
  {
    title: "Know what is due",
    text: "Give cards an owner and a due date, and see your own work on one dashboard.",
  },
];

export default function Landing() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <p className="text-3xl font-bold text-indigo-700 sm:text-4xl">
          RealTimeCards
        </p>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          A task board your whole team sees update live
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">
          Drag cards between columns, assign them and comment on them. Everyone
          looking at the same board sees each change as it happens.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/register" className="btn btn-primary">
            Sign up
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Log in
          </Link>
        </div>
        <div className="mt-6">
          <DemoButtons />
        </div>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="card">
            <h2 className="font-semibold text-slate-900">{feature.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{feature.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
