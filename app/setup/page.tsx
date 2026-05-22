import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { hasAnyAdmin } from "@/lib/setup";
import { setupFirstAdmin } from "./actions";
import { Waves } from "lucide-react";

export default async function SetupPage() {
  if (await hasAnyAdmin()) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-background to-cyan-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <Waves className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-xl">Willkommen!</CardTitle>
              <CardDescription>Einmaliges Setup</CardDescription>
            </div>
          </div>
          <CardDescription className="mt-2">
            Lege dein Admin-Konto an. Das ist dein Haupt-Login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={setupFirstAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Dein Name *</Label>
              <Input id="name" name="name" required placeholder="z.B. Leon Lellek" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail *</Label>
              <Input id="email" name="email" type="email" required placeholder="du@beispiel.de" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort *</Label>
              <Input id="password" name="password" type="password" required minLength={8} placeholder="min. 8 Zeichen" />
              <p className="text-xs text-muted-foreground">Merk's dir gut — das brauchst du jedes Mal zum Einloggen!</p>
            </div>
            <div className="flex items-start gap-2 rounded-md border bg-accent/30 p-3">
              <input id="withDemo" name="withDemo" type="checkbox" defaultChecked className="mt-1 h-4 w-4" />
              <div className="text-sm">
                <Label htmlFor="withDemo" className="cursor-pointer">Mit Beispieldaten starten</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Legt 2 Test-Mitarbeiter, 6 Artikel (Cola, Pommes...), 3 Checklisten,
                  Beispiel-Aufgaben und Schichten für die nächsten 7 Tage an. Kannst alles später ändern.
                </p>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full">
              System einrichten
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
