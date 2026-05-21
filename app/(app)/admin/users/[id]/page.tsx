import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { USER_ROLES, USER_ROLE_LABELS } from "@/lib/enums";
import { centsToEuroString } from "@/lib/money";
import { updateUser } from "../actions";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) notFound();

  const updateAction = updateUser.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mitarbeiter bearbeiten</h1>
        <p className="text-muted-foreground">{user.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stammdaten</CardTitle>
          <CardDescription>Passwort nur ausfüllen, wenn es geändert werden soll</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateAction} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" defaultValue={user.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input id="email" name="email" type="email" defaultValue={user.email} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Neues Passwort (optional)</Label>
                <Input id="password" name="password" type="password" minLength={8} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rolle *</Label>
                <Select id="role" name="role" defaultValue={user.role}>
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {USER_ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyWage">Stundenlohn (€)</Label>
                <Input
                  id="hourlyWage"
                  name="hourlyWage"
                  defaultValue={user.hourlyWageCt ? centsToEuroString(user.hourlyWageCt).replace(" €", "") : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" defaultValue={user.phone ?? ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea id="notes" name="notes" rows={3} defaultValue={user.notes ?? ""} />
            </div>
            <div className="flex items-center gap-2">
              <input id="active" name="active" type="checkbox" defaultChecked={user.active} className="h-4 w-4" />
              <Label htmlFor="active">Aktiv</Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Speichern</Button>
              <Button asChild variant="outline">
                <a href="/admin/users">Abbrechen</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
