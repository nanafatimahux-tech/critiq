import { promises as fs } from "fs";
import path from "path";
import type { Review } from "./types";
import { SAMPLE_REVIEW } from "./sample";

// Local JSON file store. Swap for Postgres when the app gets accounts/hosting;
// the Review document shape maps directly to a single JSONB row.
const DATA_DIR = path.join(process.cwd(), ".data");
const REVIEWS_DIR = path.join(DATA_DIR, "reviews");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

async function ensureDirs() {
  await fs.mkdir(REVIEWS_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

const ID_RE = /^[a-z0-9-]+$/;

export async function getReview(id: string): Promise<Review | null> {
  if (id === SAMPLE_REVIEW.id) return SAMPLE_REVIEW;
  if (!ID_RE.test(id)) return null;
  try {
    const raw = await fs.readFile(path.join(REVIEWS_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as Review;
  } catch {
    return null;
  }
}

export async function saveReview(review: Review) {
  await ensureDirs();
  review.updatedAt = new Date().toISOString();
  const file = path.join(REVIEWS_DIR, `${review.id}.json`);
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(review, null, 2));
  await fs.rename(tmp, file);
}

export async function saveUpload(id: string, name: string, data: Buffer) {
  await ensureDirs();
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const storedAs = `${id}-${Date.now()}-${safe}`;
  await fs.writeFile(path.join(UPLOADS_DIR, storedAs), data);
  return storedAs;
}

export async function readUpload(storedAs: string) {
  return fs.readFile(path.join(UPLOADS_DIR, path.basename(storedAs)));
}

export function newId() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}
