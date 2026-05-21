import { redirect } from "next/navigation";
import { auth, canManageShifts } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateInput } from "@/lib/utils";
import type { UserRole } from "@/lib/enums";
import { createShift } from "../actions";

export default async function NewShiftPage() {
  const session = await auth();
  if (!session?.user || !canManageShifts(session.user.role as UserRole)) redirect("/shifts");

  async function action(formData: FormData) {
    "use server";
    await createShift(formData);
    redirect("/shifts");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Neue Schicht</h1>
        <p className="text-muted-foreground">Schicht anlegen, Mitarbeiter tragen sich selbst ein</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Schicht</CardTitle>
          <CardDescription>Zeiten und Anzahl benötigter Mitarbeiter</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Datum *</Label>
              <Input id="date" name="date" type="date" required defaultValue={formatDateInput(new Date())} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Beginn *</Label>
                <Input id="startTime" name="startTime" type="time" required defaultValue="10:00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Ende *</Label>
                <Input id="endTime" name="endTime" type="time" required defaultValue="18:00" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Rolle/Position</Label>
                <Input id="role" name="role" placeholder="z.B. Kasse, Theke" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requiredCount">Anzahl Mitarbeiter *</Label>
                <Input id="requiredCount" name="requiredCount" type="number" min="1" max="20" required defaultValue="1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Anlegen</Button>
              <Button asChild variant="outline">
                <a href="/shifts">Abbrechen</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
