import { pool, withTransaction } from "../db.js";
import { HttpError } from "../utils/errors.js";
import { logActivity } from "./activity.js";
import { getMembers } from "./teams.js";

const STARTING_COLUMNS = [
  { name: "To Do", is_done: false },
  { name: "In Progress", is_done: false },
  { name: "Done", is_done: true },
];

// makes other changes to this board wait until this transaction ends
export async function lockBoard(db, boardId) {
  const result = await db.query(
    "SELECT id FROM boards WHERE id = $1 FOR UPDATE",
    [boardId],
  );
  if (result.rows.length === 0) {
    throw new HttpError(404, "Board not found");
  }
}

// everything the board page needs in one go
export async function getBoardData(board) {
  const [columns, cards, members] = await Promise.all([
    pool.query(
      `SELECT id, name, position, is_done
       FROM columns
       WHERE board_id = $1
       ORDER BY position`,
      [board.id],
    ),
    pool.query(
      `SELECT c.id, c.column_id, c.title, c.description, c.assignee_id,
              c.due_date, c.position, u.name AS assignee_name,
         COALESCE((SELECT json_agg(l.label ORDER BY l.label)
                   FROM card_labels l WHERE l.card_id = c.id), '[]') AS labels,
         (SELECT COUNT(*) FROM comments m WHERE m.card_id = c.id) AS comment_count
       FROM cards c
       JOIN columns col ON col.id = c.column_id
       LEFT JOIN users u ON u.id = c.assignee_id
       WHERE col.board_id = $1
       ORDER BY c.position`,
      [board.id],
    ),
    getMembers(board.team_id),
  ]);

  return {
    board,
    members,
    columns: columns.rows.map((column) => ({
      ...column,
      cards: cards.rows.filter((card) => card.column_id === column.id),
    })),
  };
}

export async function createBoard(team, user, name) {
  return withTransaction(async (db) => {
    const result = await db.query(
      `INSERT INTO boards (team_id, name, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [team.id, name, user.id],
    );
    const board = result.rows[0];
    await db.query(
      `INSERT INTO columns (board_id, name, position, is_done)
       SELECT $1, name, position - 1, is_done
       FROM unnest($2::text[], $3::boolean[]) WITH ORDINALITY
         AS start (name, is_done, position)`,
      [
        board.id,
        STARTING_COLUMNS.map((column) => column.name),
        STARTING_COLUMNS.map((column) => column.is_done),
      ],
    );
    await logActivity(db, {
      teamId: team.id,
      boardId: board.id,
      userId: user.id,
      action: "board_created",
      message: `${user.name} created the board "${name}"`,
    });
    return board;
  });
}

export async function renameBoard(board, user, name) {
  const message = `${user.name} renamed the board from "${board.name}" to "${name}"`;
  await withTransaction(async (db) => {
    await db.query("UPDATE boards SET name = $1 WHERE id = $2", [
      name,
      board.id,
    ]);
    if (name !== board.name) {
      await logActivity(db, {
        teamId: board.team_id,
        boardId: board.id,
        userId: user.id,
        action: "board_renamed",
        message,
      });
    }
  });
  return message;
}

export async function deleteBoard(board, user) {
  if (board.team_owner_id !== user.id && board.created_by !== user.id) {
    throw new HttpError(
      403,
      "Only the team owner or the person who created this board can delete it",
    );
  }

  const message = `${user.name} deleted the board "${board.name}"`;
  await withTransaction(async (db) => {
    await db.query("DELETE FROM boards WHERE id = $1", [board.id]);
    await logActivity(db, {
      teamId: board.team_id,
      userId: user.id,
      action: "board_deleted",
      message,
    });
  });
  return message;
}
