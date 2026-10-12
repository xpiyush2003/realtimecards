import { pool } from "../db.js";

// the team, only if this user is a member of it
export async function findTeamForUser(teamId, userId) {
  const result = await pool.query(
    `SELECT t.*
     FROM teams t
     JOIN team_members m ON m.team_id = t.id
     WHERE t.id = $1 AND m.user_id = $2`,
    [teamId, userId],
  );
  return result.rows[0];
}

// the board, only if this user is a member of its team
export async function findBoardForUser(boardId, userId) {
  const result = await pool.query(
    `SELECT b.*, t.name AS team_name, t.owner_id AS team_owner_id
     FROM boards b
     JOIN teams t ON t.id = b.team_id
     JOIN team_members m ON m.team_id = t.id
     WHERE b.id = $1 AND m.user_id = $2`,
    [boardId, userId],
  );
  return result.rows[0];
}
