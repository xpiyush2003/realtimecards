import { pool } from "../db.js";

const PAGE_SIZE = 30;

export async function logActivity(
  db,
  { teamId, boardId = null, userId, action, message },
) {
  await db.query(
    `INSERT INTO activity (team_id, board_id, user_id, action, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [teamId, boardId, userId, action, message],
  );
}

// one page of activity for a team, or for one board when boardId is given
export async function getActivity({ teamId, boardId = null, offset }) {
  const result = await pool.query(
    `SELECT a.id, a.action, a.message, a.created_at, a.board_id,
            u.name AS user_name
     FROM activity a
     JOIN users u ON u.id = a.user_id
     WHERE a.team_id = $1 AND ($2::int IS NULL OR a.board_id = $2)
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT $3 OFFSET $4`,
    [teamId, boardId, PAGE_SIZE + 1, offset],
  );
  return {
    items: result.rows.slice(0, PAGE_SIZE),
    has_more: result.rows.length > PAGE_SIZE,
  };
}

// reads ?offset= from the URL
export function readOffset(query) {
  const offset = Number(query.offset);
  return Number.isInteger(offset) && offset > 0 ? offset : 0;
}
