import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { createTeam, getTeams } from "../api/teams.js";
import ErrorMessage from "../components/ErrorMessage.jsx";
import Modal from "../components/Modal.jsx";
import NameForm from "../components/NameForm.jsx";
import Spinner from "../components/Spinner.jsx";
import { useApi } from "../utils/useApi.js";

function count(number, word) {
  return `${number} ${number === 1 ? word : `${word}s`}`;
}

export default function Teams() {
  const navigate = useNavigate();
  const { data, error, loading } = useApi(getTeams);
  const [creating, setCreating] = useState(false);

  async function handleCreate(name) {
    const result = await createTeam(name);
    navigate(`/teams/${result.team.id}`);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teams</h1>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          Create team
        </button>
      </div>

      <ErrorMessage message={error} />
      {loading && <Spinner />}

      {data && data.teams.length === 0 && (
        <div className="card text-center">
          <p className="font-medium">You are not in any teams yet</p>
          <p className="mt-1 text-sm text-slate-600">
            Create one, then add your teammates and your first board.
          </p>
        </div>
      )}

      {data && data.teams.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.teams.map((team) => (
            <li key={team.id}>
              <Link
                to={`/teams/${team.id}`}
                className="card block transition hover:border-indigo-300"
              >
                <p className="font-semibold text-slate-900">{team.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {count(team.member_count, "member")} ·{" "}
                  {count(team.board_count, "board")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <Modal title="Create a team" onClose={() => setCreating(false)}>
          <NameForm
            label="Team name"
            saveLabel="Create team"
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </Modal>
      )}
    </div>
  );
}
