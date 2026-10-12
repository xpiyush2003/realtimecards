import express from "express";
import cors from "cors";
import helmet from "helmet";
import { requireBoardMember } from "./middleware/access.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import authRouter from "./routes/auth.js";
import boardsRouter from "./routes/boards.js";
import cardsRouter from "./routes/cards.js";
import columnsRouter from "./routes/columns.js";
import teamsRouter from "./routes/teams.js";
import { getDashboard } from "./services/dashboard.js";

const app = express();

// Render sits behind a proxy, this lets the rate limiter see the real IP
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);

// everything below needs a logged-in user
app.use("/api", requireAuth);
app.get("/api/dashboard", async (req, res) => {
  res.json(await getDashboard(req.user.id));
});
app.use("/api/teams", teamsRouter);

// everything inside a board checks the user is in its team first
app.use("/api/boards/:boardId/columns", requireBoardMember, columnsRouter);
app.use("/api/boards/:boardId/cards", requireBoardMember, cardsRouter);
app.use("/api/boards/:boardId", requireBoardMember, boardsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
