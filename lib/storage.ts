import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { db } from "@/lib/db";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./public/uploads";

export async function saveUploadedFile(opts: {
  file: File;
  kind: string;
  uploadedById: string;
}): Promise<{ id: string; storedPath: string }> {
  const { file, kind, uploadedById } = opts;
  const bytes = Buffer.from(await file.arrayBuffer());
  const sha = createHash("sha256").update(bytes).digest("hex");

  const subdir = join(UPLOAD_DIR, kind);
  await mkdir(subdir, { recursive: true });

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const filename = `${sha}.${ext}`;
  const storedPath = join(subdir, filename);
  const relativePath = `/uploads/${kind}/${filename}`;

  await writeFile(storedPath, bytes);

  const record = await db.file.create({
    data: {
      kind,
      originalName: file.name,
      storedPath: relativePath,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: bytes.byteLength,
      sha256: sha,
      uploadedById,
    },
  });

  return { id: record.id, storedPath: relativePath };
}
