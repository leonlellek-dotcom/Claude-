import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateDE } from "@/lib/utils";
import type { UserRole } from "@/lib/enums";
import { startRun, deleteTemplate } from "./actions";
import { Plus, Play, Trash2 } from "lucide-react";

export default async function ChecklistsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role as UserRole;

  const [templates, recentRuns] = await Promise.all([
    db.checklistTemplate.findMany({
      where: { active: true },
      include: { _count: { select: { items: true } } },
      orderBy: { name: "asc" },
    }),
    db.checklistRun.findMany({
      take: 10,
      orderBy: { startedAt: "desc" },
      include: {
        template: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Checklisten</h1>
          <p className="text-muted-foreground">Vorlagen starten oder verwalten</p>
        </div>
        {role === "ADMIN" || role === "SHIFT_LEAD" ? (
          <Button asChild>
            <Link href="/checklists/templates/new">
              <Plus className="h-4 w-4" /> Neue Vorlage
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle>{t.name}</CardTitle>
              <CardDescription>
                {t.frequency ? <Badge variant="outline">{t.frequency}</Badge> : null}
                <span className="ml-2 text-xs">{t._count.items} Punkte</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {t.description ? <p className="text-sm text-muted-foreground">{t.description}</p> : null}
              <div className="flex gap-2">
                <form action={startRun.bind(null, t.id)} className="flex-1">
                  <Button type="submit" className="w-full">
                    <Play className="h-4 w-4" /> Starten
                  </Button>
                </form>
                {role === "ADMIN" ? (
                  <form action={deleteTemplate.bind(null, t.id)}>
                    <Button type="submit" variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 ? (
          <Card className="md:col-span-3">
            <CardContent className="p-8 text-center text-muted-foreground">
              Noch keine Checklisten angelegt. Lege eine Vorlage an, z.B. "Vor Rausgehen".
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Letzte Durchläufe</CardTitle>
          <CardDescription>Historie der letzten 10 abgeschlossenen Checklisten</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recentRuns.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Noch keine Durchläufe.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Vorlage</th>
                  <th className="px-4 py-2 font-medium">Mitarbeiter</th>
                  <th className="px-4 py-2 font-medium">Gestartet</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{r.template.name}</td>
                    <td className="px-4 py-2">{r.user.name}</td>
                    <td className="px-4 py-2">{formatDateDE(r.startedAt, true)}</td>
                    <td className="px-4 py-2">
                      {r.completedAt ? (
                        <Badge variant="success">Abgeschlossen</Badge>
                      ) : (
                        <Link href={`/checklists/run/${r.id}`} className="underline">
                          <Badge variant="warn">Offen — fortsetzen</Badge>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
