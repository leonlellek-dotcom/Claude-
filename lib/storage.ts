import { createHash } from "node:crypto";
import { db } from "@/lib/db";

export async function saveUploadedFile(opts: {
  file: File;
  kind: string;
  uploadedById: string;
}): Promise<{ id: string; url: string }> {
  const { file, kind, uploadedById } = opts;
  const bytes = Buffer.from(await file.arrayBuffer());
  const sha = createHash("sha256").update(bytes).digest("hex");

  const record = await db.file.create({
    data: {
      kind,
      originalName: file.name,
      data: bytes,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: bytes.byteLength,
      sha256: sha,
      uploadedById,
    },
  });

  return { id: record.id, url: `/api/files/${record.id}` };
}
