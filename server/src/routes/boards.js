import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { boardSchema } from "../schemas/index.js";
import { getActivity, readOffset } from "../services/activity.js";
import { deleteBoard, getBoardData, renameBoard } from "../services/boards.js";
import { notifyBoard } from "../socket.js";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  res.json(await getBoardData(req.board));
});

router.patch("/", validate(boardSchema), async (req, res) => {
  const message = await renameBoard(req.board, req.user, req.body.name);
  notifyBoard(req.board.id, message, req.get("X-Socket-Id"));
  res.json({ ok: true });
});

router.delete("/", async (req, res) => {
  const message = await deleteBoard(req.board, req.user);
  notifyBoard(req.board.id, message, req.get("X-Socket-Id"));
  res.json({ ok: true });
});

router.get("/activity", async (req, res) => {
  const page = await getActivity({
    teamId: req.board.team_id,
    boardId: req.board.id,
    offset: readOffset(req.query),
  });
  res.json(page);
});

export default router;
