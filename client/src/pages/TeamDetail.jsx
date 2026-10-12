import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  addMember,
  createBoard,
  deleteTeam,
  getTeam,
  getTeamActivity,
  removeMember,
  renameTeam,
} from "../api/teams.js";
import ActivityFeed from "../components/ActivityFeed.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import MembersPanel from "../components/MembersPanel.jsx";
import Modal from "../components/Modal.jsx";
import NameForm from "../components/NameForm.jsx";
import Spinner from "../components/Spinner.jsx";
import { useAuth } from "../context/AuthContext.js";
import { useApi } from "../utils/useApi.js";

const TABS = ["Boards", "Members", "Activity"];

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const teamData = useApi(useCallback(() => getTeam(id), [id]));
  const loadActivity = useCallback(
    (offset) => getTeamActivity(id, offset),
    [id],
  );

  const [tab, setTab] = useState("Boards");
  // which popup is open, like { type: "removeMember", member }
  const [modal, setModal] = useState(null);

  const closeModal = useCallback(() => setModal(null), []);

  if (teamData.loading) return <Spinner />;
  if (teamData.error) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={teamData.error} />
        <Link to="/teams" className="btn btn-secondary">
          Back to teams
        </Link>
      </div>
    );
  }

  const { team, members, boards } = teamData.data;
  const isOwner = team.owner_id === user.id;

  async function refresh() {
    setModal(null);
    await teamData.reload();
  }

  async function saveNewBoard(name) {
    const result = await createBoard(id, name);
    navigate(`/boards/${result.board.id}`);
  }

  async function saveTeamName(name) {
    await renameTeam(id, name);
    await refresh();
  }

  async function handleAddMember(email) {
    await addMember(id, email);
    await refresh();
  }

  async function confirmRemoveMember() {
    const leaving = modal.member.id === user.id;
    await removeMember(id, modal.member.id);
    if (leaving) {
      navigate("/teams");
    } else {
      await refresh();
    }
  }

  async function confirmDeleteTeam() {
    await deleteTeam(id);
    navigate("/teams");
  }

  return (
    <div>
      <Link to="/teams" className="text-sm text-indigo-700 hover:underline">
        ← All teams
      </Link>

      <div className="mt-2 mb-4 flex flex-wrap items-start justify-between gap-3">
        <h1 className="min-w-0 truncate text-2xl font-bold">{team.name}</h1>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-primary"
            onClick={() => setModal({ type: "newBoard" })}
          >
            New board
          </button>
          {isOwner && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setModal({ type: "renameTeam" })}
              >
                Rename team
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setModal({ type: "deleteTeam" })}
              >
                Delete team
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            className={`cursor-pointer border-b-2 px-4 py-2 text-sm font-medium ${
              tab === name
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {tab === "Boards" &&
        (boards.length === 0 ? (
          <div className="card text-center">
            <p className="font-medium">This team has no boards yet</p>
            <p className="mt-1 text-sm text-slate-600">
              A new board starts with To Do, In Progress and Done columns.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {boards.map((board) => (
              <li key={board.id}>
                <Link
                  to={`/boards/${board.id}`}
                  className="card block transition hover:border-indigo-300"
                >
                  <p className="font-semibold text-slate-900">{board.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {board.card_count}{" "}
                    {board.card_count === 1 ? "card" : "cards"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ))}

      {tab === "Members" && (
        <div className="card">
          <MembersPanel
            team={team}
            members={members}
            user={user}
            onAdd={handleAddMember}
            onRemove={(member) => setModal({ type: "removeMember", member })}
          />
        </div>
      )}

      {tab === "Activity" && (
        <div className="card">
          <ActivityFeed loadPage={loadActivity} />
        </div>
      )}

      {modal?.type === "newBoard" && (
        <Modal title="New board" onClose={closeModal}>
          <NameForm
            label="Board name"
            saveLabel="Create board"
            onSave={saveNewBoard}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal?.type === "renameTeam" && (
        <Modal title="Rename team" onClose={closeModal}>
          <NameForm
            label="Team name"
            start={team.name}
            saveLabel="Save"
            onSave={saveTeamName}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal?.type === "removeMember" && (
        <ConfirmDialog
          title={modal.member.id === user.id ? "Leave team?" : "Remove member?"}
          message={
            modal.member.id === user.id
              ? `You will no longer see "${team.name}" and your cards in it will be unassigned.`
              : `${modal.member.name} will no longer see this team and their cards in it will be unassigned.`
          }
          confirmLabel={modal.member.id === user.id ? "Leave" : "Remove"}
          onConfirm={confirmRemoveMember}
          onClose={closeModal}
        />
      )}

      {modal?.type === "deleteTeam" && (
        <ConfirmDialog
          title="Delete team?"
          message={`"${team.name}" and all of its boards, cards and comments will be deleted for everyone. This cannot be undone.`}
          confirmLabel="Delete team"
          onConfirm={confirmDeleteTeam}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
