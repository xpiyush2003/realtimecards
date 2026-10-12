import { findBoardForUser, findTeamForUser } from "../services/access.js";
import { HttpError } from "../utils/errors.js";
import { toId } from "../utils/ids.js";

// loads the team onto req.team, only if the user is a member
export async function requireTeamMember(req, res, next) {
  const teamId = toId(req.params.teamId, "Team not found");
  const team = await findTeamForUser(teamId, req.user.id);
  if (!team) {
    throw new HttpError(404, "Team not found");
  }
  req.team = team;
  next();
}

export function requireTeamOwner(req, res, next) {
  if (req.team.owner_id !== req.user.id) {
    throw new HttpError(403, "Only the team owner can do this");
  }
  next();
}

// loads the board onto req.board, only if the user is in its team
export async function requireBoardMember(req, res, next) {
  const boardId = toId(req.params.boardId, "Board not found");
  const board = await findBoardForUser(boardId, req.user.id);
  if (!board) {
    throw new HttpError(404, "Board not found");
  }
  req.board = board;
  next();
}
