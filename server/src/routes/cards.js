import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  commentSchema,
  createCardSchema,
  moveCardSchema,
  updateCardSchema,
} from "../schemas/index.js";
import {
  addComment,
  createCard,
  deleteCard,
  deleteComment,
  getCard,
  moveCard,
  updateCard,
} from "../services/cards.js";
import { notifyBoard } from "../socket.js";
import { toId } from "../utils/ids.js";

const router = Router({ mergeParams: true });

function cardId(req) {
  return toId(req.params.cardId, "Card not found");
}

// tells the other browsers on this board, but not the one that saved
function announce(req, message) {
  notifyBoard(req.board.id, message, req.get("X-Socket-Id"));
}

router.post("/", validate(createCardSchema), async (req, res) => {
  announce(req, await createCard(req.board, req.user, req.body));
  res.status(201).json({ ok: true });
});

router.get("/:cardId", async (req, res) => {
  res.json(await getCard(req.board, cardId(req)));
});

router.put("/:cardId", validate(updateCardSchema), async (req, res) => {
  announce(req, await updateCard(req.board, req.user, cardId(req), req.body));
  res.json({ ok: true });
});

router.patch("/:cardId/move", validate(moveCardSchema), async (req, res) => {
  announce(req, await moveCard(req.board, req.user, cardId(req), req.body));
  res.json({ ok: true });
});

router.delete("/:cardId", async (req, res) => {
  announce(req, await deleteCard(req.board, req.user, cardId(req)));
  res.json({ ok: true });
});

router.post("/:cardId/comments", validate(commentSchema), async (req, res) => {
  announce(
    req,
    await addComment(req.board, req.user, cardId(req), req.body.body),
  );
  res.status(201).json({ ok: true });
});

router.delete("/:cardId/comments/:commentId", async (req, res) => {
  const commentId = toId(req.params.commentId, "Comment not found");
  announce(
    req,
    await deleteComment(req.board, req.user, cardId(req), commentId),
  );
  res.json({ ok: true });
});

export default router;
