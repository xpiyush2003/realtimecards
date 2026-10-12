import { HttpError } from "../utils/errors.js";

// checks req.body against a zod schema and replaces it with the cleaned data
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      throw new HttpError(400, result.error.issues[0].message);
    }
    req.body = result.data;
    next();
  };
}
