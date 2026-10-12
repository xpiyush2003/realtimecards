import { pool, withTransaction } from "../db.js";
import { HttpError } from "../utils/errors.js";
import { logActivity } from "./activity.js";
import { lockBoard } from "./boards.js";
import { findColumn } from "./columns.js";
import { moveCardInLists } from "./ordering.js";

// the card with its column's name, only if it is part of this board
async function findCard(db, boardId, cardId) {
  const result = await db.query(
    `SELECT c.*, col.name AS column_name
     FROM cards c
     JOIN columns col ON col.id = c.column_id
     WHERE c.id = $1 AND col.board_id = $2`,
    [cardId, boardId],
  );
  if (result.rows.length === 0) {
    throw new HttpError(404, "Card not found");
  }
  return result.rows[0];
}

// the ids of a column's cards from top to bottom
async function getCardIds(db, columnId) {
  const result = await db.query(
    "SELECT id FROM cards WHERE column_id = $1 ORDER BY position, id",
    [columnId],
  );
  return result.rows.map((row) => row.id);
}

// writes position 0, 1, 2... in the order of the list
async function savePositions(db, cardIds) {
  await db.query(
    `UPDATE cards c SET position = o.place - 1
     FROM unnest($1::int[]) WITH ORDINALITY AS o (id, place)
     WHERE c.id = o.id`,
    [cardIds],
  );
}

function log(db, board, user, action, message) {
  return logActivity(db, {
    teamId: board.team_id,
    boardId: board.id,
    userId: user.id,
    action,
    message,
  });
}

// one card with its labels and comments, for the popup
export async function getCard(board, cardId) {
  const found = await pool.query(
    `SELECT c.id, c.column_id, c.title, c.description, c.assignee_id,
            c.due_date, c.created_at, col.name AS column_name,
            creator.name AS created_by_name,
       COALESCE((SELECT json_agg(l.label ORDER BY l.label)
                 FROM card_labels l WHERE l.card_id = c.id), '[]') AS labels
     FROM cards c
     JOIN columns col ON col.id = c.column_id
     JOIN users creator ON creator.id = c.created_by
     WHERE c.id = $1 AND col.board_id = $2`,
    [cardId, board.id],
  );
  if (found.rows.length === 0) {
    throw new HttpError(404, "Card not found");
  }

  const comments = await pool.query(
    `SELECT m.id, m.body, m.created_at, m.user_id, u.name AS user_name
     FROM comments m
     JOIN users u ON u.id = m.user_id
     WHERE m.card_id = $1
     ORDER BY m.created_at, m.id`,
    [cardId],
  );
  return { card: found.rows[0], comments: comments.rows };
}

export async function createCard(board, user, { column_id, title }) {
  return withTransaction(async (db) => {
    await lockBoard(db, board.id);
    const column = await findColumn(db, board.id, column_id);
    const cardIds = await getCardIds(db, column.id);

    // a new card goes at the bottom
    await db.query(
      `INSERT INTO cards (column_id, title, position, created_by)
       VALUES ($1, $2, $3, $4)`,
      [column.id, title, cardIds.length, user.id],
    );
    const message = `${user.name} added "${title}" to ${column.name}`;
    await log(db, board, user, "card_created", message);
    return message;
  });
}

export async function updateCard(board, user, cardId, body) {
  return withTransaction(async (db) => {
    const old = await findCard(db, board.id, cardId);

    if (body.assignee_id) {
      const member = await db.query(
        "SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2",
        [board.team_id, body.assignee_id],
      );
      if (member.rows.length === 0) {
        throw new HttpError(400, "The assignee must be a member of the team");
      }
    }

    await db.query(
      `UPDATE cards
       SET title = $1, description = $2, assignee_id = $3, due_date = $4
       WHERE id = $5`,
      [body.title, body.description, body.assignee_id, body.due_date, old.id],
    );
    // the labels are replaced as a set
    await db.query("DELETE FROM card_labels WHERE card_id = $1", [old.id]);
    await db.query(
      `INSERT INTO card_labels (card_id, label)
       SELECT $1, * FROM unnest($2::text[])`,
      [old.id, [...new Set(body.labels)]],
    );

    const message = `${user.name} edited "${body.title}"`;
    await log(db, board, user, "card_edited", message);
    return message;
  });
}

// puts a card at a place in a column and renumbers the columns it touched
export async function moveCard(board, user, cardId, { column_id, position }) {
  return withTransaction(async (db) => {
    await lockBoard(db, board.id);
    const card = await findCard(db, board.id, cardId);
    const target = await findColumn(db, board.id, column_id);
    const sameColumn = target.id === card.column_id;

    const fromIds = await getCardIds(db, card.column_id);
    const toIds = sameColumn ? fromIds : await getCardIds(db, target.id);
    const lists = moveCardInLists(
      fromIds,
      toIds,
      card.id,
      position,
      sameColumn,
    );

    if (sameColumn) {
      await savePositions(db, lists.to);
      return `${user.name} reordered the cards in ${target.name}`;
    }

    await db.query("UPDATE cards SET column_id = $1 WHERE id = $2", [
      target.id,
      card.id,
    ]);
    await savePositions(db, lists.from);
    await savePositions(db, lists.to);

    const message = `${user.name} moved "${card.title}" from ${card.column_name} to ${target.name}`;
    await log(db, board, user, "card_moved", message);
    return message;
  });
}

export async function deleteCard(board, user, cardId) {
  return withTransaction(async (db) => {
    await lockBoard(db, board.id);
    const card = await findCard(db, board.id, cardId);

    await db.query("DELETE FROM cards WHERE id = $1", [card.id]);
    await savePositions(db, await getCardIds(db, card.column_id));

    const message = `${user.name} deleted "${card.title}"`;
    await log(db, board, user, "card_deleted", message);
    return message;
  });
}

export async function addComment(board, user, cardId, body) {
  return withTransaction(async (db) => {
    const card = await findCard(db, board.id, cardId);
    await db.query(
      "INSERT INTO comments (card_id, user_id, body) VALUES ($1, $2, $3)",
      [card.id, user.id, body],
    );
    const message = `${user.name} commented on "${card.title}"`;
    await log(db, board, user, "comment_added", message);
    return message;
  });
}

// only the author or the team owner can delete a comment
export async function deleteComment(board, user, cardId, commentId) {
  const card = await findCard(pool, board.id, cardId);
  const found = await pool.query(
    "SELECT user_id FROM comments WHERE id = $1 AND card_id = $2",
    [commentId, card.id],
  );
  const comment = found.rows[0];
  if (!comment) {
    throw new HttpError(404, "Comment not found");
  }
  if (comment.user_id !== user.id && board.team_owner_id !== user.id) {
    throw new HttpError(
      403,
      "Only the author or the team owner can delete this comment",
    );
  }

  await pool.query("DELETE FROM comments WHERE id = $1", [commentId]);
  return `${user.name} deleted a comment on "${card.title}"`;
}
