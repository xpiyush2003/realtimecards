import { HttpError } from "./errors.js";

const MAX_ID = 2147483647;

// turns an id from the URL into a number, anything else is a 404
export function toId(value, message = "Not found") {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1 || id > MAX_ID) {
    throw new HttpError(404, message);
  }
  return id;
}
