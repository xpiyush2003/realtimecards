import { DragDropContext } from "@hello-pangea/dnd";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  addColumn,
  createCard,
  deleteBoard,
  deleteCard,
  deleteColumn,
  getBoard,
  getBoardActivity,
  moveCard,
  renameBoard,
  updateColumn,
} from "../api/boards.js";
import ActivityFeed from "../components/ActivityFeed.jsx";
import BoardColumn from "../components/BoardColumn.jsx";
import CardModal from "../components/CardModal.jsx";
import ColumnForm from "../components/ColumnForm.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import Modal from "../components/Modal.jsx";
import NameForm from "../components/NameForm.jsx";
import Spinner from "../components/Spinner.jsx";
import Viewers from "../components/Viewers.jsx";
import { useAuth } from "../context/AuthContext.js";
import { moveCardOnBoard } from "../utils/board.js";
import { todayInIndia } from "../utils/dates.js";
import { useBoardSocket } from "../utils/useBoardSocket.js";

export default function Board() {
  const { id } = useParams();
  // the key starts everything fresh when going from one board to another
  return <BoardView key={id} boardId={Number(id)} />;
}

function BoardView({ boardId }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [gone, setGone] = useState(false);
  const [error, setError] = useState("");
  // goes up by one on every load, the card popup watches it
  const [version, setVersion] = useState(0);
  // the small note saying what someone else just did
  const [notice, setNotice] = useState("");
  // which popup is open, like { type: "card", cardId }
  const [modal, setModal] = useState(null);

  const latestLoad = useRef(0);
  const dragging = useRef(false);
  const movesSaving = useRef(0);
  const reloadWaiting = useRef(false);

  // gets the board from the server, only the newest answer is used
  const load = useCallback(() => {
    const mine = ++latestLoad.current;
    return getBoard(boardId)
      .then((result) => {
        if (mine !== latestLoad.current) return;
        // never swap the cards around while one is being dragged
        if (dragging.current) {
          reloadWaiting.current = true;
          return;
        }
        setData(result);
        setVersion((old) => old + 1);
        // close the card popup if that card no longer exists
        setModal((open) => {
          if (open?.type !== "card") return open;
          const exists = result.columns.some((column) =>
            column.cards.some((card) => card.id === open.cardId),
          );
          return exists ? open : null;
        });
      })
      .catch((err) => {
        if (mine !== latestLoad.current) return;
        if (err.status === 404) {
          setGone(true);
        } else {
          setError(err.message);
        }
      });
  }, [boardId]);

  // someone else changed the board, or the connection came back
  const handleChanged = useCallback(
    (message) => {
      if (message) setNotice(message);
      if (dragging.current || movesSaving.current > 0) {
        reloadWaiting.current = true;
      } else {
        load();
      }
    },
    [load],
  );

  const { viewers, connected } = useBoardSocket(boardId, handleChanged);

  useEffect(() => {
    load();
  }, [load]);

  // the note goes away by itself
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const closeModal = useCallback(() => setModal(null), []);
  const loadActivity = useCallback(
    (offset) => getBoardActivity(boardId, offset),
    [boardId],
  );

  if (gone) {
    return (
      <div className="mx-auto max-w-sm py-16 text-center">
        <h1 className="text-xl font-semibold">Board not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          It may have been deleted, or you are no longer in its team.
        </p>
        <Link to="/teams" className="btn btn-primary mt-6">
          Back to teams
        </Link>
      </div>
    );
  }
  if (!data) {
    return error ? <ErrorMessage message={error} /> : <Spinner />;
  }

  const { board, members, columns } = data;
  const isTeamOwner = board.team_owner_id === user.id;
  const canDelete = isTeamOwner || board.created_by === user.id;
  const today = todayInIndia();

  // called after one of my own saves
  async function refresh() {
    setModal(null);
    setError("");
    await load();
  }

  function handleDragStart() {
    dragging.current = true;
  }

  async function handleDragEnd(result) {
    dragging.current = false;
    const { source, destination } = result;
    const stayedPut =
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index);

    if (stayedPut) {
      if (reloadWaiting.current) {
        reloadWaiting.current = false;
        load();
      }
      return;
    }

    const cardId = Number(result.draggableId);
    const columnId = Number(destination.droppableId);

    // show the card in its new place first, then save it
    setData((old) => ({
      ...old,
      columns: moveCardOnBoard(
        old.columns,
        cardId,
        columnId,
        destination.index,
      ),
    }));
    setError("");
    movesSaving.current++;
    try {
      await moveCard(boardId, cardId, columnId, destination.index);
    } catch (err) {
      setError(err.message);
    }
    movesSaving.current--;

    // once my moves are saved, make sure the screen matches the database
    if (movesSaving.current === 0) {
      reloadWaiting.current = false;
      load();
    }
  }

  async function handleAddCard(column, title) {
    try {
      await createCard(boardId, column.id, title);
      setError("");
      await load();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  async function saveColumn(body) {
    await updateColumn(boardId, modal.column.id, body);
    await refresh();
  }

  async function saveNewColumn(name) {
    await addColumn(boardId, name);
    await refresh();
  }

  async function confirmDeleteColumn() {
    await deleteColumn(boardId, modal.column.id);
    await refresh();
  }

  async function confirmDeleteCard() {
    await deleteCard(boardId, modal.card.id);
    await refresh();
  }

  async function saveBoardName(name) {
    await renameBoard(boardId, name);
    await refresh();
  }

  async function confirmDeleteBoard() {
    await deleteBoard(boardId);
    navigate(`/teams/${board.team_id}`);
  }

  return (
    <div>
      <Link
        to={`/teams/${board.team_id}`}
        className="text-sm text-indigo-700 hover:underline"
      >
        ← {board.team_name}
      </Link>

      <div className="mt-2 mb-4 flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 truncate text-2xl font-bold">{board.name}</h1>
        <Viewers viewers={viewers} userId={user.id} connected={connected} />
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => setModal({ type: "activity" })}
          >
            Activity
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setModal({ type: "renameBoard" })}
          >
            Rename
          </button>
          {canDelete && (
            <button
              className="btn btn-secondary"
              onClick={() => setModal({ type: "deleteBoard" })}
            >
              Delete board
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <ErrorMessage message={error} />
      </div>

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex items-start gap-3 overflow-x-auto pb-4">
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              today={today}
              onOpenCard={(card) => setModal({ type: "card", cardId: card.id })}
              onAddCard={handleAddCard}
              onEdit={(picked) => setModal({ type: "column", column: picked })}
            />
          ))}
          <button
            className="w-72 shrink-0 cursor-pointer rounded-xl border-2 border-dashed border-slate-300 px-3 py-2 text-left text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-700"
            onClick={() => setModal({ type: "newColumn" })}
          >
            + Add a column
          </button>
        </div>
      </DragDropContext>

      {notice && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-20 w-max max-w-[90vw] -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg"
        >
          {notice}
        </div>
      )}

      {modal?.type === "card" && (
        <CardModal
          boardId={boardId}
          cardId={modal.cardId}
          members={members}
          user={user}
          isTeamOwner={isTeamOwner}
          version={version}
          onSaved={refresh}
          onCommented={load}
          onDelete={(card) => setModal({ type: "deleteCard", card })}
          onClose={closeModal}
        />
      )}

      {modal?.type === "deleteCard" && (
        <ConfirmDialog
          title="Delete card?"
          message={`"${modal.card.title}" and its comments will be deleted for everyone.`}
          confirmLabel="Delete"
          onConfirm={confirmDeleteCard}
          onClose={closeModal}
        />
      )}

      {modal?.type === "newColumn" && (
        <Modal title="Add a column" onClose={closeModal}>
          <NameForm
            label="Column name"
            maxLength={40}
            saveLabel="Add column"
            onSave={saveNewColumn}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal?.type === "column" && (
        <Modal title="Edit column" onClose={closeModal}>
          <ColumnForm
            column={modal.column}
            onSave={saveColumn}
            onDelete={() =>
              setModal({ type: "deleteColumn", column: modal.column })
            }
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal?.type === "deleteColumn" && (
        <ConfirmDialog
          title="Delete column?"
          message={
            modal.column.cards.length === 0
              ? `"${modal.column.name}" is empty and will be removed.`
              : `"${modal.column.name}" and the ${modal.column.cards.length} ${modal.column.cards.length === 1 ? "card" : "cards"} in it will be deleted for everyone.`
          }
          confirmLabel="Delete"
          onConfirm={confirmDeleteColumn}
          onClose={closeModal}
        />
      )}

      {modal?.type === "renameBoard" && (
        <Modal title="Rename board" onClose={closeModal}>
          <NameForm
            label="Board name"
            start={board.name}
            saveLabel="Save"
            onSave={saveBoardName}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal?.type === "deleteBoard" && (
        <ConfirmDialog
          title="Delete board?"
          message={`"${board.name}" and all of its columns, cards and comments will be deleted for everyone. This cannot be undone.`}
          confirmLabel="Delete board"
          onConfirm={confirmDeleteBoard}
          onClose={closeModal}
        />
      )}

      {modal?.type === "activity" && (
        <Modal title="Board activity" onClose={closeModal}>
          <div className="max-h-[60vh] overflow-y-auto">
            <ActivityFeed key={version} loadPage={loadActivity} />
          </div>
        </Modal>
      )}
    </div>
  );
}
