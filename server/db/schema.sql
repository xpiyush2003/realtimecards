CREATE TABLE IF NOT EXISTS users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id INTEGER NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users (id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS boards (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- position is the place on the board from the left, starting at 0
CREATE TABLE IF NOT EXISTS columns (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  board_id INTEGER NOT NULL REFERENCES boards (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- position is the place in the column from the top, starting at 0
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  column_id INTEGER NOT NULL REFERENCES columns (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  assignee_id INTEGER REFERENCES users (id),
  due_date DATE,
  position INTEGER NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS card_labels (
  card_id INTEGER NOT NULL REFERENCES cards (id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (
    label IN ('bug', 'feature', 'design', 'research', 'urgent', 'chore')
  ),
  PRIMARY KEY (card_id, label)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards (id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users (id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- board_id is empty for team events, and after a board is deleted
CREATE TABLE IF NOT EXISTS activity (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  board_id INTEGER REFERENCES boards (id) ON DELETE SET NULL,
  user_id INTEGER NOT NULL REFERENCES users (id),
  action TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS team_members_user_idx ON team_members (user_id);
CREATE INDEX IF NOT EXISTS boards_team_idx ON boards (team_id);
CREATE INDEX IF NOT EXISTS columns_board_idx ON columns (board_id);
CREATE INDEX IF NOT EXISTS cards_column_idx ON cards (column_id);
CREATE INDEX IF NOT EXISTS cards_assignee_idx ON cards (assignee_id);
CREATE INDEX IF NOT EXISTS comments_card_idx ON comments (card_id);
CREATE INDEX IF NOT EXISTS activity_team_idx ON activity (team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_board_idx ON activity (board_id, created_at DESC);
