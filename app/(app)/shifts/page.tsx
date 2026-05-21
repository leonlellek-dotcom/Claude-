import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateDE, startOfWeek, addDays, WEEKDAY_LABELS_LONG, sameDay } from "@/lib/utils";
import { canManageShifts } from "@/lib/auth";
import type { UserRole } from "@/lib/enums";
import { signUpForShift, cancelAssignment, deleteShift } from "./actions";
import { Plus, Trash2, UserPlus, UserMinus } from "lucide-react";

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;
  const userRole = session.user.role as UserRole;

  const { week } = await searchParams;
  const baseDate = week ? new Date(week) : new Date();
  const weekStart = startOfWeek(baseDate);
  const weekEnd = addDays(weekStart, 7);

  const shifts = await db.shift.findMany({
    where: { date: { gte: weekStart, lt: weekEnd } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: {
      assignments: {
        where: { status: { not: "CANCELLED" } },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const prevWeek = addDays(weekStart, -7).toISOString().slice(0, 10);
  const nextWeek = addDays(weekStart, 7).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schichten</h1>
          <p className="text-muted-foreground">
            {formatDateDE(weekStart)} – {formatDateDE(addDays(weekEnd, -1))}
          </p>
        </div>
        <div className="flex gap-2">
          {canManageShifts(userRole) ? (
            <Button asChild>
              <Link href="/shifts/new">
                <Plus className="h-4 w-4" /> Neue Schicht
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href={`/shifts?week=${prevWeek}`}>← Vorige Woche</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/shifts">Heute</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/shifts?week=${nextWeek}`}>Nächste Woche →</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        {days.map((day) => {
          const dayShifts = shifts.filter((s) => sameDay(s.date, day));
          const today = sameDay(day, new Date());
          return (
            <Card key={day.toISOString()} className={today ? "border-primary" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>
                    {WEEKDAY_LABELS_LONG[day.getDay()]}, {formatDateDE(day)}
                  </span>
                  {today ? <Badge>Heute</Badge> : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dayShifts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Schichten geplant.</p>
                ) : (
                  dayShifts.map((s) => {
                    const myAssignment = s.assignments.find((a) => a.user.id === userId);
                    const isFull = s.assignments.length >= s.requiredCount;
                    return (
                      <div key={s.id} className="rounded-md border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">
                              {s.startTime}–{s.endTime}
                              {s.role ? <span className="ml-2 text-muted-foreground">• {s.role}</span> : null}
                            </div>
                            {s.notes ? <div className="text-xs text-muted-foreground">{s.notes}</div> : null}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {s.assignments.length === 0 ? (
                                <span className="text-xs text-muted-foreground">Noch niemand eingetragen</span>
                              ) : (
                                s.assignments.map((a) => (
                                  <Badge key={a.id} variant={a.status === "CONFIRMED" ? "success" : "secondary"}>
                                    {a.user.name}
                                  </Badge>
                                ))
                              )}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {s.assignments.length} / {s.requiredCount} besetzt
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {myAssignment ? (
                              <form action={cancelAssignment.bind(null, myAssignment.id)}>
                                <Button type="submit" size="sm" variant="outline">
                                  <UserMinus className="h-4 w-4" /> Austragen
                                </Button>
                              </form>
                            ) : (
                              <form action={signUpForShift.bind(null, s.id)}>
                                <Button type="submit" size="sm" disabled={isFull} variant={isFull ? "secondary" : "default"}>
                                  <UserPlus className="h-4 w-4" /> {isFull ? "Voll" : "Eintragen"}
                                </Button>
                              </form>
                            )}
                            {canManageShifts(userRole) ? (
                              <form action={deleteShift.bind(null, s.id)}>
                                <Button type="submit" size="sm" variant="ghost">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </form>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
