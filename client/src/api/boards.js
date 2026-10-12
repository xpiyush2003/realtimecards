import { request } from "./client.js";

export function getBoard(boardId) {
  return request(`/boards/${boardId}`);
}

export function renameBoard(boardId, name) {
  return request(`/boards/${boardId}`, { method: "PATCH", body: { name } });
}

export function deleteBoard(boardId) {
  return request(`/boards/${boardId}`, { method: "DELETE" });
}

export function getBoardActivity(boardId, offset = 0) {
  return request(`/boards/${boardId}/activity?offset=${offset}`);
}

export function addColumn(boardId, name) {
  return request(`/boards/${boardId}/columns`, {
    method: "POST",
    body: { name },
  });
}

export function updateColumn(boardId, columnId, body) {
  return request(`/boards/${boardId}/columns/${columnId}`, {
    method: "PATCH",
    body,
  });
}

export function deleteColumn(boardId, columnId) {
  return request(`/boards/${boardId}/columns/${columnId}`, {
    method: "DELETE",
  });
}

export function createCard(boardId, columnId, title) {
  return request(`/boards/${boardId}/cards`, {
    method: "POST",
    body: { column_id: columnId, title },
  });
}

export function getCard(boardId, cardId) {
  return request(`/boards/${boardId}/cards/${cardId}`);
}

export function updateCard(boardId, cardId, body) {
  return request(`/boards/${boardId}/cards/${cardId}`, {
    method: "PUT",
    body,
  });
}

export function moveCard(boardId, cardId, columnId, position) {
  return request(`/boards/${boardId}/cards/${cardId}/move`, {
    method: "PATCH",
    body: { column_id: columnId, position },
  });
}

export function deleteCard(boardId, cardId) {
  return request(`/boards/${boardId}/cards/${cardId}`, { method: "DELETE" });
}

export function addComment(boardId, cardId, body) {
  return request(`/boards/${boardId}/cards/${cardId}/comments`, {
    method: "POST",
    body: { body },
  });
}

export function deleteComment(boardId, cardId, commentId) {
  return request(`/boards/${boardId}/cards/${cardId}/comments/${commentId}`, {
    method: "DELETE",
  });
}
