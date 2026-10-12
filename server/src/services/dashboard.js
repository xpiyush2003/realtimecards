import { pool } from "../db.js";
import { addDays, todayInIndia } from "../utils/dates.js";

const DAYS_AHEAD = 7;

// every card assigned to this user, in the teams they are still in
async function getMyCards(userId) {
  const result = await pool.query(
    `SELECT c.id, c.title, c.due_date, col.name AS column_name, col.is_done,
            b.id AS board_id, b.name AS board_name
     FROM cards c
     JOIN columns col ON col.id = c.column_id
     JOIN boards b ON b.id = col.board_id
     JOIN team_members m ON m.team_id = b.team_id AND m.user_id = c.assignee_id
     WHERE c.assignee_id = $1
     ORDER BY col.position, col.name, c.due_date`,
    [userId],
  );
  return result.rows;
}

// turns the list of my cards into the numbers the dashboard shows
export function summarise(cards, today) {
  const lastDay = addDays(today, DAYS_AHEAD - 1);
  const open = cards.filter((card) => !card.is_done);
  const overdue = open.filter((card) => card.due_date && card.due_date < today);
  const dueSoon = open.filter(
    (card) =>
      card.due_date && card.due_date >= today && card.due_date <= lastDay,
  );

  // one bar per column name
  const byStatus = [];
  for (const card of cards) {
    let row = byStatus.find((item) => item.status === card.column_name);
    if (!row) {
      row = { status: card.column_name, count: 0 };
      byStatus.push(row);
    }
    row.count++;
  }

  // one bar per day, starting today
  const dueByDay = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const date = addDays(today, i);
    dueByDay.push({
      date,
      count: dueSoon.filter((card) => card.due_date === date).length,
    });
  }

  return {
    today,
    totals: {
      open: open.length,
      due_soon: dueSoon.length,
      overdue: overdue.length,
      finished: cards.length - open.length,
    },
    by_status: byStatus,
    due_by_day: dueByDay,
    due_cards: [...overdue, ...dueSoon].sort((a, b) =>
      a.due_date.localeCompare(b.due_date),
    ),
  };
}

export async function getDashboard(userId) {
  return summarise(await getMyCards(userId), todayInIndia());
}
