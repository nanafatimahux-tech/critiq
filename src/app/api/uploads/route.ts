import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { UPLOAD_PATH_RE } from "@/lib/store";

export const runtime = "nodejs";

// Issues short-lived tokens so the browser can upload portfolio files straight
// to the private Blob store, bypassing Vercel's 4.5 MB request-body limit.
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!UPLOAD_PATH_RE.test(pathname)) throw new Error("Invalid file name.");
        return {
          allowedContentTypes: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
          maximumSizeInBytes: 30 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
