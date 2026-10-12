import { Router } from "express";
import { requireTeamMember, requireTeamOwner } from "../middleware/access.js";
import { validate } from "../middleware/validate.js";
import { addMemberSchema, boardSchema, teamSchema } from "../schemas/index.js";
import { getActivity, readOffset } from "../services/activity.js";
import { createBoard } from "../services/boards.js";
import {
  addMember,
  createTeam,
  deleteTeam,
  getMembers,
  getTeamBoards,
  getTeamsFor,
  removeMember,
  renameTeam,
} from "../services/teams.js";
import { notifyBoard, removeFromBoards } from "../socket.js";
import { toId } from "../utils/ids.js";

const router = Router();

router.get("/", async (req, res) => {
  res.json({ teams: await getTeamsFor(req.user.id) });
});

router.post("/", validate(teamSchema), async (req, res) => {
  const team = await createTeam(req.user, req.body.name);
  res.status(201).json({ team });
});

router.get("/:teamId", requireTeamMember, async (req, res) => {
  const [members, boards] = await Promise.all([
    getMembers(req.team.id),
    getTeamBoards(req.team.id),
  ]);
  res.json({ team: req.team, members, boards });
});

router.patch(
  "/:teamId",
  requireTeamMember,
  requireTeamOwner,
  validate(teamSchema),
  async (req, res) => {
    const team = await renameTeam(req.team, req.user, req.body.name);
    res.json({ team });
  },
);

router.delete(
  "/:teamId",
  requireTeamMember,
  requireTeamOwner,
  async (req, res) => {
    const boardIds = await deleteTeam(req.team);
    const message = `${req.user.name} deleted the team "${req.team.name}"`;
    for (const boardId of boardIds) {
      notifyBoard(boardId, message);
    }
    res.json({ ok: true });
  },
);

router.post(
  "/:teamId/members",
  requireTeamMember,
  requireTeamOwner,
  validate(addMemberSchema),
  async (req, res) => {
    await addMember(req.team, req.user, req.body.email);
    res.status(201).json({ members: await getMembers(req.team.id) });
  },
);

router.delete(
  "/:teamId/members/:userId",
  requireTeamMember,
  async (req, res) => {
    const userId = toId(req.params.userId, "That person is not in this team");
    const { message, boardIds } = await removeMember(
      req.team,
      req.user,
      userId,
    );
    await removeFromBoards(userId, boardIds, message);
    res.json({ ok: true });
  },
);

router.post(
  "/:teamId/boards",
  requireTeamMember,
  validate(boardSchema),
  async (req, res) => {
    const board = await createBoard(req.team, req.user, req.body.name);
    res.status(201).json({ board });
  },
);

router.get("/:teamId/activity", requireTeamMember, async (req, res) => {
  const page = await getActivity({
    teamId: req.team.id,
    offset: readOffset(req.query),
  });
  res.json(page);
});

export default router;
