import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateDE } from "@/lib/utils";
import { completeRun } from "../../actions";
import { ChecklistItemRow } from "./item-row";

export default async function RunPage({ params }: { params: Promise<{ runId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { runId } = await params;
  const run = await db.checklistRun.findUnique({
    where: { id: runId },
    include: {
      template: { include: { items: { orderBy: { orderIdx: "asc" } } } },
      items: true,
      user: { select: { name: true } },
    },
  });
  if (!run) notFound();

  if (run.completedAt) {
    // Read-only Ansicht
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{run.template.name}</h1>
          <p className="text-muted-foreground">
            Abgeschlossen am {formatDateDE(run.completedAt, true)} von {run.user.name}
          </p>
        </div>
        <Card>
          <CardContent className="p-4">
            <ul className="space-y-2">
              {run.template.items.map((item) => {
                const ri = run.items.find((i) => i.itemId === item.id);
                return (
                  <li key={item.id} className="flex items-center gap-3 rounded-md border p-3">
                    <input type="checkbox" checked={ri?.checked ?? false} disabled className="h-5 w-5" />
                    <span className={ri?.checked ? "line-through text-muted-foreground" : ""}>{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedRun = completeRun.bind(null, runId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{run.template.name}</h1>
        <p className="text-muted-foreground">
          Gestartet {formatDateDE(run.startedAt, true)} von {run.user.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Punkte abhaken</CardTitle>
          <CardDescription>Tippe jeden Punkt an, wenn erledigt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {run.template.items.map((item) => {
            const ri = run.items.find((i) => i.itemId === item.id);
            return (
              <ChecklistItemRow
                key={item.id}
                runId={runId}
                itemId={item.id}
                text={item.text}
                initialChecked={ri?.checked ?? false}
              />
            );
          })}
        </CardContent>
      </Card>

      <form action={completedRun}>
        <Button type="submit" size="lg" className="w-full">
          Checkliste abschließen
        </Button>
      </form>
    </div>
  );
}
