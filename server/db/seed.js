import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool, withTransaction } from "../src/db.js";
import { DEMO_EMAILS } from "../src/services/auth.js";
import { addDays, todayInIndia } from "../src/utils/dates.js";

const today = todayInIndia();

const people = [
  { key: "aarav", name: "Aarav Mehta", email: DEMO_EMAILS.aarav },
  { key: "diya", name: "Diya Kapoor", email: DEMO_EMAILS.diya },
  { key: "kabir", name: "Kabir Singh", email: "kabir@realtimecards.app" },
  { key: "meera", name: "Meera Nair", email: "meera@realtimecards.app" },
  { key: "rohan", name: "Rohan Gupta", email: "rohan@realtimecards.app" },
];

// a card is [title, assignee, due in days from today, labels, extras]
const teams = [
  {
    name: "Product Team",
    owner: "aarav",
    members: ["aarav", "diya", "kabir", "meera", "rohan"],
    createdDaysAgo: 30,
    boards: [
      {
        name: "Website Redesign",
        createdBy: "aarav",
        createdDaysAgo: 21,
        columns: [
          {
            name: "To Do",
            cards: [
              ["Write copy for the pricing page", "meera", 5, ["feature"]],
              ["Add dark mode toggle", "aarav", 9, ["feature", "design"]],
              ["Audit images for missing alt text", "rohan", 3, ["chore"]],
              ["Research cookie banner options", null, null, ["research"]],
            ],
          },
          {
            name: "In Progress",
            cards: [
              [
                "Build the new landing page hero",
                "aarav",
                2,
                ["feature", "design"],
                {
                  description:
                    "Big heading, one line about the product and a sign-up button. Use the new colour palette.",
                  comments: [
                    ["diya", "The final illustration is in the shared folder."],
                    ["aarav", "Thanks, adding it today."],
                  ],
                },
              ],
              [
                "Fix navbar overlap on small screens",
                "diya",
                -1,
                ["bug", "urgent"],
                {
                  description:
                    "The menu button sits on top of the logo below 360px wide.",
                  comments: [
                    ["kabir", "I can see this on my phone too."],
                    ["diya", "Found it, the logo has a fixed width."],
                  ],
                },
              ],
              ["Set up the contact form API", "kabir", 4, ["feature"]],
            ],
          },
          {
            name: "In Review",
            cards: [
              [
                "Redesign the footer",
                "diya",
                0,
                ["design"],
                {
                  comments: [["meera", "Looks clean. Can we add the address?"]],
                },
              ],
              ["Compress hero images", "aarav", -2, ["chore"]],
            ],
          },
          {
            name: "Done",
            isDone: true,
            cards: [
              ["Pick the colour palette", "meera", -10, ["design"]],
              ["Set up the project repo", "aarav", -15, ["chore"]],
              ["Collect feedback on the old site", "rohan", -12, ["research"]],
              ["Wireframes for the home page", "diya", -8, ["design"]],
            ],
          },
        ],
      },
      {
        name: "Mobile App Launch",
        createdBy: "diya",
        createdDaysAgo: 14,
        columns: [
          {
            name: "Backlog",
            cards: [
              [
                "Offline mode for saved items",
                null,
                null,
                ["feature", "research"],
              ],
              ["Share to WhatsApp button", "kabir", null, ["feature"]],
            ],
          },
          {
            name: "To Do",
            cards: [
              ["Write the Play Store listing", "meera", 6, ["chore"]],
              ["Push notification for due tasks", "aarav", 4, ["feature"]],
              [
                "Crash on login with empty password",
                "rohan",
                1,
                ["bug", "urgent"],
                {
                  comments: [
                    ["aarav", "Happens every time on Android 14."],
                    ["rohan", "On it."],
                  ],
                },
              ],
            ],
          },
          {
            name: "In Progress",
            cards: [
              ["Onboarding screens", "diya", 3, ["design", "feature"]],
              [
                "Speed up the app start time",
                "aarav",
                1,
                ["research"],
                {
                  description:
                    "Cold start takes about 4 seconds on older phones. Aim for under 2.",
                },
              ],
              ["Fix keyboard covering the input", "kabir", -3, ["bug"]],
            ],
          },
          {
            name: "Done",
            isDone: true,
            cards: [
              ["App icon and splash screen", "diya", -5, ["design"]],
              ["Set up crash reporting", "aarav", -6, ["chore"]],
              ["Login with phone number", "rohan", -4, ["feature"]],
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Weekend Hackathon",
    owner: "diya",
    members: ["diya", "aarav", "kabir"],
    createdDaysAgo: 6,
    boards: [
      {
        name: "Hackathon Project",
        createdBy: "diya",
        createdDaysAgo: 5,
        columns: [
          {
            name: "To Do",
            cards: [
              ["Record the demo video", "aarav", 2, ["chore"]],
              ["Write the pitch slides", "diya", 2, ["design"]],
            ],
          },
          {
            name: "In Progress",
            cards: [
              ["Build the leaderboard page", "kabir", 1, ["feature"]],
              [
                "Hook up the scoring API",
                "aarav",
                0,
                ["feature", "urgent"],
                {
                  comments: [["kabir", "The endpoint is ready on my branch."]],
                },
              ],
            ],
          },
          {
            name: "Done",
            isDone: true,
            cards: [
              ["Decide the project idea", "diya", -4, ["research"]],
              ["Create the starter project", "kabir", -4, ["chore"]],
            ],
          },
        ],
      },
    ],
  },
];

// noon in India that many days ago
function daysAgo(days) {
  return new Date(`${addDays(today, -days)}T12:00:00+05:30`);
}

await withTransaction(async (db) => {
  // clear the old demo data first, real accounts are never touched
  await db.query(
    "DELETE FROM teams WHERE owner_id IN (SELECT id FROM users WHERE is_demo)",
  );
  await db.query("DELETE FROM users WHERE is_demo");

  // nobody logs in to these accounts with a password
  const passwordHash = await bcrypt.hash(randomUUID(), 10);
  const users = {};
  for (const person of people) {
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, is_demo)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, name`,
      [person.name, person.email, passwordHash],
    );
    users[person.key] = result.rows[0];
  }

  async function log(teamId, boardId, who, action, message, createdAt) {
    await db.query(
      `INSERT INTO activity (team_id, board_id, user_id, action, message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [teamId, boardId, users[who].id, action, message, createdAt],
    );
  }

  for (const team of teams) {
    const owner = users[team.owner];
    const teamCreatedAt = daysAgo(team.createdDaysAgo);

    const teamResult = await db.query(
      `INSERT INTO teams (name, owner_id, created_at)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [team.name, owner.id, teamCreatedAt],
    );
    const teamId = teamResult.rows[0].id;
    await log(
      teamId,
      null,
      team.owner,
      "team_created",
      `${owner.name} created the team "${team.name}"`,
      teamCreatedAt,
    );

    let minutes = 0;
    for (const key of team.members) {
      const joinedAt = new Date(teamCreatedAt.getTime() + minutes * 60000);
      await db.query(
        "INSERT INTO team_members (team_id, user_id, joined_at) VALUES ($1, $2, $3)",
        [teamId, users[key].id, joinedAt],
      );
      if (key !== team.owner) {
        await log(
          teamId,
          null,
          team.owner,
          "member_added",
          `${owner.name} added ${users[key].name} to the team`,
          joinedAt,
        );
      }
      minutes++;
    }

    for (const board of team.boards) {
      const creator = users[board.createdBy];
      const boardCreatedAt = daysAgo(board.createdDaysAgo);

      const boardResult = await db.query(
        `INSERT INTO boards (team_id, name, created_by, created_at)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [teamId, board.name, creator.id, boardCreatedAt],
      );
      const boardId = boardResult.rows[0].id;

      // the board's history, in the order it happened
      const events = [];
      const firstColumn = board.columns[0].name;

      for (const [columnIndex, column] of board.columns.entries()) {
        const columnResult = await db.query(
          `INSERT INTO columns (board_id, name, position, is_done, created_at)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            boardId,
            column.name,
            columnIndex,
            Boolean(column.isDone),
            boardCreatedAt,
          ],
        );
        const columnId = columnResult.rows[0].id;

        for (const [cardIndex, card] of column.cards.entries()) {
          const [title, assignee, due, labels, extras = {}] = card;
          const author = assignee ?? board.createdBy;

          const cardResult = await db.query(
            `INSERT INTO cards
               (column_id, title, description, assignee_id, due_date, position, created_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [
              columnId,
              title,
              extras.description ?? "",
              assignee ? users[assignee].id : null,
              due === null ? null : addDays(today, due),
              cardIndex,
              users[author].id,
              boardCreatedAt,
            ],
          );
          const cardId = cardResult.rows[0].id;

          await db.query(
            `INSERT INTO card_labels (card_id, label)
             SELECT $1, * FROM unnest($2::text[])`,
            [cardId, labels],
          );

          events.push({
            order: 1,
            who: author,
            action: "card_created",
            message: `${users[author].name} added "${title}" to ${firstColumn}`,
          });
          if (columnIndex > 0) {
            events.push({
              order: 2,
              who: author,
              action: "card_moved",
              message: `${users[author].name} moved "${title}" from ${firstColumn} to ${column.name}`,
            });
          }
          for (const [who, body] of extras.comments ?? []) {
            events.push({
              order: 3,
              who,
              action: "comment_added",
              message: `${users[who].name} commented on "${title}"`,
              comment: { cardId, body },
            });
          }
        }
      }

      // cards are added first, then moved, then talked about
      events.sort((a, b) => a.order - b.order);

      await log(
        teamId,
        boardId,
        board.createdBy,
        "board_created",
        `${creator.name} created the board "${board.name}"`,
        boardCreatedAt,
      );

      // spread the events between the board's first day and an hour ago
      const start = boardCreatedAt.getTime();
      const end = Date.now() - 60 * 60 * 1000;
      const step = (end - start) / (events.length + 1);
      for (const [index, event] of events.entries()) {
        const when = new Date(start + step * (index + 1));
        if (event.comment) {
          await db.query(
            `INSERT INTO comments (card_id, user_id, body, created_at)
             VALUES ($1, $2, $3, $4)`,
            [
              event.comment.cardId,
              users[event.who].id,
              event.comment.body,
              when,
            ],
          );
        }
        await log(
          teamId,
          boardId,
          event.who,
          event.action,
          event.message,
          when,
        );
      }
    }
  }
});

console.log("Demo data is ready");
await pool.end();
