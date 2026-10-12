import { withTransaction } from "../db.js";
import { HttpError } from "../utils/errors.js";
import { logActivity } from "./activity.js";
import { lockBoard } from "./boards.js";

const MAX_COLUMNS = 20;

// the column, only if it is part of this board
export async function findColumn(db, boardId, columnId) {
  const result = await db.query(
    "SELECT * FROM columns WHERE id = $1 AND board_id = $2",
    [columnId, boardId],
  );
  if (result.rows.length === 0) {
    throw new HttpError(404, "Column not found");
  }
  return result.rows[0];
}

export async function addColumn(board, user, name) {
  const message = `${user.name} added the column "${name}"`;
  await withTransaction(async (db) => {
    await lockBoard(db, board.id);
    const count = await db.query(
      "SELECT COUNT(*) AS total FROM columns WHERE board_id = $1",
      [board.id],
    );
    const total = count.rows[0].total;
    if (total >= MAX_COLUMNS) {
      throw new HttpError(400, `A board can have up to ${MAX_COLUMNS} columns`);
    }

    // a new column goes on the right
    await db.query(
      "INSERT INTO columns (board_id, name, position) VALUES ($1, $2, $3)",
      [board.id, name, total],
    );
    await logActivity(db, {
      teamId: board.team_id,
      boardId: board.id,
      userId: user.id,
      action: "column_added",
      message,
    });
  });
  return message;
}

export async function updateColumn(board, user, columnId, body) {
  return withTransaction(async (db) => {
    const old = await findColumn(db, board.id, columnId);
    const name = body.name ?? old.name;
    const isDone = body.is_done ?? old.is_done;

    await db.query("UPDATE columns SET name = $1, is_done = $2 WHERE id = $3", [
      name,
      isDone,
      old.id,
    ]);

    let message = `${user.name} updated the column "${name}"`;
    if (name !== old.name) {
      message = `${user.name} renamed the column "${old.name}" to "${name}"`;
      await logActivity(db, {
        teamId: board.team_id,
        boardId: board.id,
        userId: user.id,
        action: "column_renamed",
        message,
      });
    }
    if (isDone !== old.is_done) {
      message = isDone
        ? `${user.name} marked "${name}" as a finished column`
        : `${user.name} marked "${name}" as not finished`;
      await logActivity(db, {
        teamId: board.team_id,
        boardId: board.id,
        userId: user.id,
        action: "column_done_changed",
        message,
      });
    }
    return message;
  });
}

// the column's cards go with it
export async function deleteColumn(board, user, columnId) {
  return withTransaction(async (db) => {
    await lockBoard(db, board.id);
    const column = await findColumn(db, board.id, columnId);
    const cards = await db.query(
      "SELECT COUNT(*) AS total FROM cards WHERE column_id = $1",
      [column.id],
    );
    const total = cards.rows[0].total;

    await db.query("DELETE FROM columns WHERE id = $1", [column.id]);
    // close the gap so positions are 0, 1, 2... again
    await db.query(
      `UPDATE columns c SET position = o.place - 1
       FROM (
         SELECT id, ROW_NUMBER() OVER (ORDER BY position) AS place
         FROM columns WHERE board_id = $1
       ) o
       WHERE c.id = o.id`,
      [board.id],
    );

    const cardsText = total === 1 ? "1 card" : `${total} cards`;
    const message = `${user.name} deleted the column "${column.name}" (${cardsText})`;
    await logActivity(db, {
      teamId: board.team_id,
      boardId: board.id,
      userId: user.id,
      action: "column_deleted",
      message,
    });
    return message;
  });
}
