import { z } from "zod";

export const LABELS = [
  "bug",
  "feature",
  "design",
  "research",
  "urgent",
  "chore",
];

const MAX_ID = 2147483647;

const id = z.int().positive().max(MAX_ID);
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

function name(what, max) {
  return z
    .string()
    .trim()
    .min(1, `${what} is required`)
    .max(max, `${what} is too long`);
}

export const registerSchema = z.object({
  name: name("Name", 50),
  email,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const demoSchema = z.object({
  who: z.enum(["aarav", "diya"]).default("aarav"),
});

export const teamSchema = z.object({ name: name("Team name", 60) });

export const addMemberSchema = z.object({ email });

export const boardSchema = z.object({ name: name("Board name", 60) });

export const createColumnSchema = z.object({ name: name("Column name", 40) });

export const updateColumnSchema = z.object({
  name: name("Column name", 40).optional(),
  is_done: z.boolean().optional(),
});

export const createCardSchema = z.object({
  column_id: id,
  title: name("Title", 120),
});

export const updateCardSchema = z.object({
  title: name("Title", 120),
  description: z.string().trim().max(2000, "Description is too long"),
  assignee_id: id.nullable(),
  due_date: z.iso.date("Enter a valid date").nullable(),
  labels: z.array(z.enum(LABELS)).max(LABELS.length),
});

export const moveCardSchema = z.object({
  column_id: id,
  position: z.int().min(0),
});

export const commentSchema = z.object({ body: name("Comment", 1000) });
