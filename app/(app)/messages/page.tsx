import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateDE } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function postMessage(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;
  await db.handoverNote.create({
    data: { authorId: session.user.id, content },
  });
  revalidatePath("/messages");
}

export default async function MessagesPage() {
  const notes = await db.handoverNote.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mitteilungen</h1>
        <p className="text-muted-foreground">Schichtübergabe-Notizen und interne Nachrichten</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neue Mitteilung</CardTitle>
          <CardDescription>z.B. Schichtübergabe, Hinweise, Erinnerungen</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={postMessage} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="content">Inhalt *</Label>
              <Textarea id="content" name="content" rows={3} required />
            </div>
            <Button type="submit">Veröffentlichen</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {notes.map((n) => (
          <Card key={n.id}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">{n.author.name}</span>
                <span>{formatDateDE(n.createdAt, true)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{n.content}</p>
            </CardContent>
          </Card>
        ))}
        {notes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Noch keine Mitteilungen.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
