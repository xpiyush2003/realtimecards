# RealTimeCards

RealTimeCards is a task board for small teams, similar to Trello. A team has
boards, a board has columns, and a column has cards. You drag cards between
columns as the work moves along.

The part I built it for is the live updates. When one person moves, edits or
comments on a card, everyone else looking at that board sees the change
straight away, without refreshing the page.

## Try it

Click **Try the demo as Aarav** on the home page. Then open the site again in
a private window and click **Try the demo as Diya**. Open the same board in
both windows and drag a card in one of them. It moves in the other.

A private window is needed because the login is saved per browser, so two
normal tabs would be the same person.

## Features

- Sign up and log in, plus two one-click demo logins with sample data
- Teams with an owner and members
- Boards with columns and cards
- Cards with a title, description, assignee, due date and labels
- Comments on cards
- Drag and drop to reorder cards and move them between columns, with the
  order saved (works with the keyboard too)
- Live updates for everyone viewing the same board
- A "who is viewing this board" indicator
- An activity log for each board and each team
- A dashboard with my open, due soon, overdue and finished cards, and two
  charts

## Tech stack

**Frontend:** React, Vite, Tailwind CSS, React Router, Recharts,
@hello-pangea/dnd for drag and drop, Socket.IO client

**Backend:** Node.js, Express, Socket.IO, PostgreSQL (hosted on Neon), JWT
login, Zod for validation

I did not use an ORM. All the database queries are plain SQL using the `pg`
library, because I wanted to practise writing SQL myself.

## How the live updates work

**The REST API does all the saving. The socket only says "something
changed".** When I move a card, my browser sends a normal request to the API.
After the API has saved it, the server sends a small `board:changed` message
to the other browsers on that board, and each of them loads the board again
from the API. No data is ever saved through the socket, so there is only one
way for anything to get into the database.

There are only three socket events:

| Event | Direction | What it is for |
| --- | --- | --- |
| `board:join` | browser to server | "I am looking at this board" |
| `board:changed` | server to browsers | "This board changed, load it again" |
| `board:viewers` | server to browsers | The list of people on the board right now |

**The socket is checked like the API.** A socket has to send the same login
token as the API when it connects. To join a board's room, the server runs
the same "is this user in the board's team?" check that the API uses. If
someone is removed from a team while they are looking at one of its boards,
the server takes them out of the room at once.

## A few things I learned building it

**Card order is a number.** Every card stores its position in its column: 0,
1, 2 and so on. When a card is moved, the server takes it out of its old
column, puts it into the new one at the right place, and renumbers both
columns, all inside one transaction.

**Two people can move cards at the same moment.** Every change to card order
locks the board's row in the database first, so the second move waits for the
first one to finish. The positions can never end up doubled or with gaps. If
two people move the same card, the last save wins and everyone ends up seeing
the same board.

**Connections drop.** When the connection comes back, the browser joins the
board again and reloads it, so it catches up on everything it missed in one
go.

**The screen updates before the save finishes.** A dragged card moves on
screen immediately and is saved in the background. If the save fails, the
board is reloaded from the server.

**Dates are plain dates.** A due date is stored and sent as `YYYY-MM-DD`
text, and "today" always means today in India, so a date can never shift by a
day because of time zones.

**Permissions are checked on the server.** Every request for a board checks
that the user is in its team, and every card, column and comment id is
checked to belong to that board. Hiding a button in React is not enough.

## Running it on your computer

You need Node.js 22 or newer and a PostgreSQL database. I use a free
[Neon](https://neon.tech) database.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
```

Open `server/.env` and fill in:

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | The pooled connection string from Neon, ending in `sslmode=verify-full` |
| `JWT_SECRET` | Any long random string |
| `CLIENT_URL` | Where the frontend runs, `http://localhost:5173` locally |
| `PORT` | The port for the API and the socket, `4000` locally |

Then create the tables, load the demo data and start the server:

```bash
npm run migrate
npm run seed
npm run dev
```

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173 and click one of the demo buttons.

## Folder structure

```
client/   React app
  src/api          functions that call the API
  src/components   the board column, card, popups, charts and other pieces
  src/context      keeps track of the logged-in user
  src/pages        one file per page
  src/utils        date helpers and the hook that holds the live connection

server/   Express API and Socket.IO
  src/routes       one file per group of endpoints
  src/middleware   login check, team and board checks, validation, errors
  src/services     the real work: cards, card order, boards, teams, dashboard
  src/schemas      validation rules
  src/socket.js    everything to do with live updates
  db/              the tables, the migration script and the demo data
```

## Deploying

I deploy the database on Neon, the server on Render and the frontend on
Vercel. The API and the live connection run in the same Render service, so
there is nothing extra to set up for the socket.

**Render (server)**

- New Web Service from this repository
- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`
- Environment variables: `DATABASE_URL`, `JWT_SECRET` and `CLIENT_URL` (the
  Vercel address, with no slash at the end)

**Vercel (frontend)**

- New project from this repository
- Root directory: `client`
- Framework preset: Vite
- Environment variable: `VITE_API_URL`, the Render address on its own, with
  no `/api` and no slash at the end

To set up the live database, run `npm run migrate` and `npm run seed` from the
`server` folder with `DATABASE_URL` pointing at it.

### What a visitor sees on the free plan

Render's free plan puts the server to sleep after 15 minutes without any
traffic, and waking it takes about a minute.

- The first click after a sleep is slow. The demo buttons show "Waking up the
  server, this can take up to a minute" while they wait.
- While a board is open, the live connection keeps sending small messages, and
  Render counts those as traffic, so the server should stay awake.
- If the server does restart while a board is open, the board shows
  "Reconnecting...", connects again by itself and reloads.

## Things I would add next

- Dragging columns to reorder them
- Custom labels for each board
- Notifications when a card is assigned to me
- Running more than one server, using the Socket.IO Redis adapter so a change
  saved on one server reaches browsers connected to another
- Automated tests for the card ordering
