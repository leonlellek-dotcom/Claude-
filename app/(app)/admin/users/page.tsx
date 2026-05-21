import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { centsToEuroString } from "@/lib/money";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/enums";
import { Plus } from "lucide-react";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SHIFT_LEAD")) {
    redirect("/dashboard");
  }

  const users = await db.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mitarbeiter</h1>
          <p className="text-muted-foreground">Team-Verwaltung</p>
        </div>
        {session.user.role === "ADMIN" ? (
          <Button asChild>
            <Link href="/admin/users/new">
              <Plus className="h-4 w-4" /> Mitarbeiter anlegen
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Mitarbeiter ({users.length})</CardTitle>
          <CardDescription>Klicke auf einen Eintrag zum Bearbeiten</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">E-Mail</th>
                <th className="px-4 py-2 font-medium">Rolle</th>
                <th className="px-4 py-2 font-medium">Lohn/h</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="px-4 py-2">
                    {session.user.role === "ADMIN" ? (
                      <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                        {u.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{u.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2">
                    <Badge variant="outline">{USER_ROLE_LABELS[u.role as UserRole]}</Badge>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{centsToEuroString(u.hourlyWageCt)}</td>
                  <td className="px-4 py-2">
                    {u.active ? (
                      <Badge variant="success">Aktiv</Badge>
                    ) : (
                      <Badge variant="secondary">Inaktiv</Badge>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Noch keine Mitarbeiter angelegt.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
