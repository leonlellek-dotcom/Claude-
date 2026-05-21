import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateDE } from "@/lib/utils";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  RECURRENCE_LABELS,
  type TaskPriority,
  type TaskStatus,
  type RecurrenceType,
} from "@/lib/enums";
import { setTaskStatus, deleteTask } from "./actions";
import { Plus, Check, Play, Trash2, RotateCcw } from "lucide-react";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  const { filter = "open" } = await searchParams;

  const where = filter === "all" ? {} : filter === "done" ? { status: "DONE" } : { status: { in: ["OPEN", "IN_PROGRESS"] } };

  const tasks = await db.task.findMany({
    where,
    include: { assignee: { select: { name: true } }, createdBy: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aufgaben</h1>
          <p className="text-muted-foreground">Aufgaben verteilen und abhaken</p>
        </div>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="h-4 w-4" /> Neue Aufgabe
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <FilterTab href="/tasks?filter=open" label="Offen" active={filter === "open"} />
        <FilterTab href="/tasks?filter=done" label="Erledigt" active={filter === "done"} />
        <FilterTab href="/tasks?filter=all" label="Alle" active={filter === "all"} />
      </div>

      <Card>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">Keine Aufgaben in diesem Filter.</p>
          ) : (
            <ul className="divide-y">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          t.status === "DONE"
                            ? "text-muted-foreground line-through"
                            : "font-medium"
                        }
                      >
                        {t.title}
                      </span>
                      <Badge variant={priorityVariant(t.priority as TaskPriority)}>
                        {TASK_PRIORITY_LABELS[t.priority as TaskPriority]}
                      </Badge>
                      <Badge variant={statusVariant(t.status as TaskStatus)}>
                        {TASK_STATUS_LABELS[t.status as TaskStatus]}
                      </Badge>
                      {t.recurrence !== "NONE" ? (
                        <Badge variant="outline">
                          <RotateCcw className="mr-1 h-3 w-3 inline" />
                          {RECURRENCE_LABELS[t.recurrence as RecurrenceType]}
                        </Badge>
                      ) : null}
                    </div>
                    {t.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {t.dueAt ? <span>Fällig: {formatDateDE(t.dueAt, true)}</span> : null}
                      {t.assignee ? <span>Zugewiesen an: {t.assignee.name}</span> : <span>Nicht zugewiesen</span>}
                      <span>Erstellt von: {t.createdBy.name}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {t.status !== "DONE" ? (
                      <>
                        {t.status === "OPEN" ? (
                          <form action={setTaskStatus.bind(null, t.id, "IN_PROGRESS")}>
                            <Button type="submit" size="sm" variant="outline">
                              <Play className="h-4 w-4" /> Starten
                            </Button>
                          </form>
                        ) : null}
                        <form action={setTaskStatus.bind(null, t.id, "DONE")}>
                          <Button type="submit" size="sm" variant="success">
                            <Check className="h-4 w-4" /> Erledigt
                          </Button>
                        </form>
                      </>
                    ) : (
                      <form action={setTaskStatus.bind(null, t.id, "OPEN")}>
                        <Button type="submit" size="sm" variant="outline">
                          Wieder öffnen
                        </Button>
                      </form>
                    )}
                    <form action={deleteTask.bind(null, t.id)}>
                      <Button type="submit" size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        "rounded-md px-3 py-1.5 text-sm font-medium " +
        (active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent")
      }
    >
      {label}
    </Link>
  );
}

function priorityVariant(p: TaskPriority): "default" | "secondary" | "warn" | "destructive" {
  switch (p) {
    case "URGENT":
      return "destructive";
    case "HIGH":
      return "warn";
    case "LOW":
      return "secondary";
    default:
      return "default";
  }
}

function statusVariant(s: TaskStatus): "default" | "secondary" | "success" | "outline" {
  switch (s) {
    case "DONE":
      return "success";
    case "IN_PROGRESS":
      return "default";
    case "CANCELLED":
      return "outline";
    default:
      return "secondary";
  }
}
