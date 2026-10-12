// the server's address, REST lives under /api and the socket uses it as it is
export const SERVER_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "realtimecards_token";

// set while a board page has a live connection open
let socketId = null;

export function setSocketId(id) {
  socketId = id;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// the saved token is no longer valid, so log the user out
export function logOutEverywhere() {
  clearToken();
  window.dispatchEvent(new Event("unauthorized"));
}

// every API call goes through here
export async function request(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  // lets the server skip this browser when it announces the change
  if (socketId && method !== "GET") headers["X-Socket-Id"] = socketId;

  let response;
  try {
    response = await fetch(`${SERVER_URL}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Could not reach the server, please try again");
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && token) {
    logOutEverywhere();
  }
  if (!response.ok) {
    const error = new Error(
      data.error || "Something went wrong, please try again",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
