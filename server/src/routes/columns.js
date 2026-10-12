import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { createColumnSchema, updateColumnSchema } from "../schemas/index.js";
import { addColumn, deleteColumn, updateColumn } from "../services/columns.js";
import { notifyBoard } from "../socket.js";
import { toId } from "../utils/ids.js";

const router = Router({ mergeParams: true });

function columnId(req) {
  return toId(req.params.columnId, "Column not found");
}

router.post("/", validate(createColumnSchema), async (req, res) => {
  const message = await addColumn(req.board, req.user, req.body.name);
  notifyBoard(req.board.id, message, req.get("X-Socket-Id"));
  res.status(201).json({ ok: true });
});

router.patch("/:columnId", validate(updateColumnSchema), async (req, res) => {
  const message = await updateColumn(
    req.board,
    req.user,
    columnId(req),
    req.body,
  );
  notifyBoard(req.board.id, message, req.get("X-Socket-Id"));
  res.json({ ok: true });
});

router.delete("/:columnId", async (req, res) => {
  const message = await deleteColumn(req.board, req.user, columnId(req));
  notifyBoard(req.board.id, message, req.get("X-Socket-Id"));
  res.json({ ok: true });
});

export default router;
