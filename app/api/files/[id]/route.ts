import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Nicht angemeldet", { status: 401 });
  }
  const { id } = await params;
  const file = await db.file.findUnique({ where: { id } });
  if (!file || !file.data) {
    return new NextResponse("Datei nicht gefunden", { status: 404 });
  }
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.originalName)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
