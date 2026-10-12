import { HttpError } from "../utils/errors.js";

export function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

// every error thrown in a route ends up here
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ error: "The request body is not valid JSON" });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong, please try again" });
}
