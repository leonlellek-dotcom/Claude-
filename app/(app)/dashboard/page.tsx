import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { centsToEuroString } from "@/lib/money";
import { formatDateDE } from "@/lib/utils";
import { TASK_PRIORITY_LABELS, type TaskPriority } from "@/lib/enums";
import { CalendarDays, ListChecks, ClipboardCheck, Package, AlertCircle, Wallet } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [myShiftsToday, openTasks, products, lastCashCount, openShiftsSoon] = await Promise.all([
    db.shiftAssignment.findMany({
      where: {
        userId,
        shift: { date: { gte: today, lt: tomorrow } },
      },
      include: { shift: true },
      orderBy: { shift: { startTime: "asc" } },
    }),
    db.task.findMany({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
        OR: [{ assigneeId: userId }, { assigneeId: null }],
      },
      take: 5,
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
    }),
    db.product.findMany({
      where: { active: true },
      include: { movements: { select: { type: true, qty: true } } },
    }),
    db.cashCount.findFirst({ orderBy: { countedAt: "desc" }, include: { user: true } }),
    db.shift.findMany({
      where: { date: { gte: today }, assignments: { none: {} } },
      take: 5,
      orderBy: { date: "asc" },
    }),
  ]);

  const lowStock = products
    .map((p) => {
      const balance = p.movements.reduce((acc, m) => {
        const sign = m.type === "RECEIPT" || m.type === "ADJUSTMENT" ? 1 : -1;
        return acc + sign * m.qty;
      }, 0);
      return { ...p, balance };
    })
    .filter((p) => p.balance <= p.minStock);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hallo, {session.user.name?.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground">Übersicht für heute, {formatDateDE(today)}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          title="Meine Schicht heute"
          value={myShiftsToday.length === 0 ? "Keine" : `${myShiftsToday[0].shift.startTime}–${myShiftsToday[0].shift.endTime}`}
          href="/shifts"
        />
        <StatCard
          icon={<ListChecks className="h-5 w-5" />}
          title="Offene Aufgaben"
          value={openTasks.length.toString()}
          href="/tasks"
        />
        <StatCard
          icon={<Package className="h-5 w-5" />}
          title="Niedrigbestand"
          value={lowStock.length.toString()}
          highlight={lowStock.length > 0}
          href="/inventory"
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          title="Letzte Kasse"
          value={lastCashCount ? centsToEuroString(lastCashCount.totalCt) : "—"}
          subtitle={lastCashCount ? formatDateDE(lastCashCount.countedAt, true) : undefined}
          href="/cashbook"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Meine nächsten Aufgaben</CardTitle>
            <CardDescription>Offene Aufgaben für dich</CardDescription>
          </CardHeader>
          <CardContent>
            {openTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine offenen Aufgaben — gut gemacht!</p>
            ) : (
              <ul className="space-y-3">
                {openTasks.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                    <div>
                      <div className="font-medium">{t.title}</div>
                      {t.dueAt ? (
                        <div className="text-xs text-muted-foreground">Fällig: {formatDateDE(t.dueAt, true)}</div>
                      ) : null}
                    </div>
                    <Badge variant={priorityVariant(t.priority as TaskPriority)}>
                      {TASK_PRIORITY_LABELS[t.priority as TaskPriority]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/tasks">Alle Aufgaben →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schnellzugriff</CardTitle>
            <CardDescription>Häufige Aktionen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" size="lg" className="h-auto flex-col py-4">
                <Link href="/checklists">
                  <ClipboardCheck className="mb-2 h-6 w-6" />
                  Checkliste starten
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-auto flex-col py-4">
                <Link href="/cashbook/count">
                  <Wallet className="mb-2 h-6 w-6" />
                  Kasse zählen
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-auto flex-col py-4">
                <Link href="/inventory/movement">
                  <Package className="mb-2 h-6 w-6" />
                  Wareneingang
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-auto flex-col py-4">
                <Link href="/purchases/new">
                  <ClipboardCheck className="mb-2 h-6 w-6" />
                  Rechnung hochladen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {lowStock.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warn" /> Niedrigbestand
            </CardTitle>
            <CardDescription>Artikel unter Mindestbestand</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {lowStock.slice(0, 10).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{p.name}</span>
                  <span className="text-muted-foreground">
                    {p.balance} {p.unit} (min: {p.minStock})
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {openShiftsSoon.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Unbesetzte Schichten</CardTitle>
            <CardDescription>Hier wird noch jemand gebraucht</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {openShiftsSoon.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium">{formatDateDE(s.date)}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.startTime}–{s.endTime} {s.role ? `• ${s.role}` : ""}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/shifts">Anzeigen</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  highlight,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className={highlight ? "border-warn" : ""}>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-md bg-accent p-3 text-accent-foreground">{icon}</div>
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="truncate text-xl font-semibold">{value}</div>
            {subtitle ? <div className="truncate text-xs text-muted-foreground">{subtitle}</div> : null}
          </div>
        </CardContent>
      </Card>
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
