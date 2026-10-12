import { pool, withTransaction } from "../db.js";
import { HttpError } from "../utils/errors.js";
import { logActivity } from "./activity.js";

export async function getMembers(teamId, db = pool) {
  const result = await db.query(
    `SELECT u.id, u.name, u.email, m.joined_at
     FROM team_members m
     JOIN users u ON u.id = m.user_id
     WHERE m.team_id = $1
     ORDER BY m.joined_at, u.id`,
    [teamId],
  );
  return result.rows;
}

export async function getBoardIds(teamId, db = pool) {
  const result = await db.query("SELECT id FROM boards WHERE team_id = $1", [
    teamId,
  ]);
  return result.rows.map((row) => row.id);
}

// my teams with a few counts for the list page
export async function getTeamsFor(userId) {
  const result = await pool.query(
    `SELECT t.id, t.name, t.owner_id, t.created_at,
       (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) AS member_count,
       (SELECT COUNT(*) FROM boards b WHERE b.team_id = t.id) AS board_count
     FROM teams t
     JOIN team_members m ON m.team_id = t.id
     WHERE m.user_id = $1
     ORDER BY t.created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function getTeamBoards(teamId) {
  const result = await pool.query(
    `SELECT b.id, b.name, b.created_by, b.created_at,
       (SELECT COUNT(*) FROM cards c
        JOIN columns col ON col.id = c.column_id
        WHERE col.board_id = b.id) AS card_count
     FROM boards b
     WHERE b.team_id = $1
     ORDER BY b.created_at, b.id`,
    [teamId],
  );
  return result.rows;
}

export async function createTeam(user, name) {
  return withTransaction(async (db) => {
    const result = await db.query(
      "INSERT INTO teams (name, owner_id) VALUES ($1, $2) RETURNING *",
      [name, user.id],
    );
    const team = result.rows[0];
    await db.query(
      "INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)",
      [team.id, user.id],
    );
    await logActivity(db, {
      teamId: team.id,
      userId: user.id,
      action: "team_created",
      message: `${user.name} created the team "${name}"`,
    });
    return team;
  });
}

export async function renameTeam(team, user, name) {
  return withTransaction(async (db) => {
    const result = await db.query(
      "UPDATE teams SET name = $1 WHERE id = $2 RETURNING *",
      [name, team.id],
    );
    if (name !== team.name) {
      await logActivity(db, {
        teamId: team.id,
        userId: user.id,
        action: "team_renamed",
        message: `${user.name} renamed the team from "${team.name}" to "${name}"`,
      });
    }
    return result.rows[0];
  });
}

// returns the ids of the boards that went with it
export async function deleteTeam(team) {
  return withTransaction(async (db) => {
    const boardIds = await getBoardIds(team.id, db);
    await db.query("DELETE FROM teams WHERE id = $1", [team.id]);
    return boardIds;
  });
}

export async function addMember(team, user, email) {
  const found = await pool.query(
    "SELECT id, name, is_demo FROM users WHERE email = $1",
    [email],
  );
  const person = found.rows[0];
  if (!person) {
    throw new HttpError(404, "No account found with that email");
  }
  // demo accounts and real accounts are kept in separate teams
  if (person.is_demo !== user.is_demo) {
    throw new HttpError(400, "This account cannot be added to this team");
  }

  await withTransaction(async (db) => {
    const added = await db.query(
      `INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [team.id, person.id],
    );
    if (added.rowCount === 0) {
      throw new HttpError(409, `${person.name} is already in this team`);
    }
    await logActivity(db, {
      teamId: team.id,
      userId: user.id,
      action: "member_added",
      message: `${user.name} added ${person.name} to the team`,
    });
  });
}

// the owner removes someone, or a member removes themselves to leave
export async function removeMember(team, user, userId) {
  const leaving = userId === user.id;
  if (!leaving && team.owner_id !== user.id) {
    throw new HttpError(403, "Only the team owner can remove members");
  }
  if (userId === team.owner_id) {
    throw new HttpError(
      400,
      "The owner cannot leave the team, delete the team instead",
    );
  }

  return withTransaction(async (db) => {
    const removed = await db.query(
      `DELETE FROM team_members m
       USING users u
       WHERE u.id = m.user_id AND m.team_id = $1 AND m.user_id = $2
       RETURNING u.name`,
      [team.id, userId],
    );
    if (removed.rowCount === 0) {
      throw new HttpError(404, "That person is not in this team");
    }
    const person = removed.rows[0];

    // their cards in this team go back to nobody
    await db.query(
      `UPDATE cards SET assignee_id = NULL
       WHERE assignee_id = $1 AND column_id IN (
         SELECT col.id FROM columns col
         JOIN boards b ON b.id = col.board_id
         WHERE b.team_id = $2
       )`,
      [userId, team.id],
    );

    const message = leaving
      ? `${user.name} left the team`
      : `${user.name} removed ${person.name} from the team`;
    await logActivity(db, {
      teamId: team.id,
      userId: user.id,
      action: leaving ? "member_left" : "member_removed",
      message,
    });
    return { message, boardIds: await getBoardIds(team.id, db) };
  });
}
