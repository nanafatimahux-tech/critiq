import { promises as fs } from "fs";
import path from "path";
import { get, head, put } from "@vercel/blob";
import type { Review } from "./types";
import { SAMPLE_REVIEW } from "./sample";

// Two backends behind one interface:
// - Vercel Blob (private store) when BLOB_READ_WRITE_TOKEN is set — required on
//   Vercel, whose filesystem is read-only. Reviews are JSON documents; uploads
//   arrive straight from the browser (see /api/uploads).
// - Local JSON files under .data/ otherwise, for offline development.
export const CLOUD = !!process.env.BLOB_READ_WRITE_TOKEN;

const DATA_DIR = path.join(process.cwd(), ".data");
const REVIEWS_DIR = path.join(DATA_DIR, "reviews");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

// Browser uploads land under this prefix; anything else is rejected as input.
export const UPLOAD_PATH_RE = /^uploads\/[A-Za-z0-9._-]+$/;

async function ensureDirs() {
  await fs.mkdir(REVIEWS_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

const ID_RE = /^[a-z0-9-]+$/;

// useCache: false reads origin storage, so polling always sees the latest progress.
async function readBlob(pathname: string) {
  const res = await get(pathname, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return null;
  return Buffer.from(await new Response(res.stream).arrayBuffer());
}

export async function getReview(id: string): Promise<Review | null> {
  if (id === SAMPLE_REVIEW.id) return SAMPLE_REVIEW;
  if (!ID_RE.test(id)) return null;
  try {
    if (CLOUD) {
      const data = await readBlob(`reviews/${id}.json`);
      return data ? (JSON.parse(data.toString("utf8")) as Review) : null;
    }
    const raw = await fs.readFile(path.join(REVIEWS_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as Review;
  } catch {
    return null;
  }
}

export async function saveReview(review: Review) {
  review.updatedAt = new Date().toISOString();
  if (CLOUD) {
    await put(`reviews/${review.id}.json`, JSON.stringify(review), {
      access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true,
    });
    return;
  }
  await ensureDirs();
  const file = path.join(REVIEWS_DIR, `${review.id}.json`);
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(review, null, 2));
  await fs.rename(tmp, file);
}

// Local-only path: in the cloud, files never pass through our server (Vercel caps request bodies at 4.5 MB).
export async function saveUpload(id: string, name: string, data: Buffer) {
  await ensureDirs();
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const storedAs = `${id}-${Date.now()}-${safe}`;
  await fs.writeFile(path.join(UPLOADS_DIR, storedAs), data);
  return storedAs;
}

// Size of an uploaded blob, or null if it doesn't exist in our store.
export async function uploadSize(pathname: string) {
  if (!UPLOAD_PATH_RE.test(pathname)) return null;
  try {
    return (await head(pathname)).size;
  } catch {
    return null;
  }
}

export async function readUpload(storedAs: string) {
  if (UPLOAD_PATH_RE.test(storedAs) && CLOUD) {
    const data = await readBlob(storedAs);
    if (!data) throw new Error("Uploaded file is no longer available.");
    return data;
  }
  return fs.readFile(path.join(UPLOADS_DIR, path.basename(storedAs)));
}

export function newId() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}
