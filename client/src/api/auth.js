import { request } from "./client.js";

export function register(name, email, password) {
  return request("/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
}

export function login(email, password) {
  return request("/auth/login", { method: "POST", body: { email, password } });
}

export function demoLogin(who) {
  return request("/auth/demo", { method: "POST", body: { who } });
}

export function getMe() {
  return request("/auth/me");
}
