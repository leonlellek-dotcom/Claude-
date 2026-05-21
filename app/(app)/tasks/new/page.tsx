import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, RECURRENCE_TYPES, RECURRENCE_LABELS } from "@/lib/enums";
import { createTask } from "../actions";

export default async function NewTaskPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const users = await db.user.findMany({ where: { active: true }, orderBy: { name: "asc" } });

  async function action(formData: FormData) {
    "use server";
    await createTask(formData);
    redirect("/tasks");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Neue Aufgabe</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Aufgabe</CardTitle>
          <CardDescription>Optional zuweisen oder offen lassen (jeder darf sie nehmen)</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dueAt">Fällig am</Label>
                <Input id="dueAt" name="dueAt" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigneeId">Zugewiesen an</Label>
                <Select id="assigneeId" name="assigneeId" defaultValue="">
                  <option value="">— Nicht zugewiesen —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorität</Label>
                <Select id="priority" name="priority" defaultValue="NORMAL">
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {TASK_PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurrence">Wiederholung</Label>
                <Select id="recurrence" name="recurrence" defaultValue="NONE">
                  {RECURRENCE_TYPES.map((r) => (
                    <option key={r} value={r}>
                      {RECURRENCE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Anlegen</Button>
              <Button asChild variant="outline">
                <a href="/tasks">Abbrechen</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
