import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { USER_ROLES, USER_ROLE_LABELS } from "@/lib/enums";
import { createUser } from "../actions";

export default async function NewUserPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Neuer Mitarbeiter</h1>
        <p className="text-muted-foreground">Stammdaten und Zugangsdaten anlegen</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mitarbeiterdaten</CardTitle>
          <CardDescription>Pflichtfelder sind markiert</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createUser} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passwort * (min. 8 Zeichen)</Label>
                <Input id="password" name="password" type="password" required minLength={8} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rolle *</Label>
                <Select id="role" name="role" defaultValue="EMPLOYEE">
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {USER_ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyWage">Stundenlohn (€)</Label>
                <Input id="hourlyWage" name="hourlyWage" placeholder="z.B. 13,50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>
            <div className="flex items-center gap-2">
              <input id="active" name="active" type="checkbox" defaultChecked className="h-4 w-4" />
              <Label htmlFor="active">Aktiv</Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Anlegen</Button>
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
