import { request } from "./client.js";

export function getDashboard() {
  return request("/dashboard");
}

export function getTeams() {
  return request("/teams");
}

export function createTeam(name) {
  return request("/teams", { method: "POST", body: { name } });
}

export function getTeam(teamId) {
  return request(`/teams/${teamId}`);
}

export function renameTeam(teamId, name) {
  return request(`/teams/${teamId}`, { method: "PATCH", body: { name } });
}

export function deleteTeam(teamId) {
  return request(`/teams/${teamId}`, { method: "DELETE" });
}

export function addMember(teamId, email) {
  return request(`/teams/${teamId}/members`, {
    method: "POST",
    body: { email },
  });
}

export function removeMember(teamId, userId) {
  return request(`/teams/${teamId}/members/${userId}`, { method: "DELETE" });
}

export function createBoard(teamId, name) {
  return request(`/teams/${teamId}/boards`, { method: "POST", body: { name } });
}

export function getTeamActivity(teamId, offset = 0) {
  return request(`/teams/${teamId}/activity?offset=${offset}`);
}
