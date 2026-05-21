"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { TASK_PRIORITIES, TASK_STATUSES, RECURRENCE_TYPES } from "@/lib/enums";

const taskSchema = z.object({
  title: z.string().min(1, "Titel fehlt"),
  description: z.string().optional(),
  dueAt: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(TASK_PRIORITIES),
  recurrence: z.enum(RECURRENCE_TYPES),
});

export async function createTask(formData: FormData) {
  const user = await requireUser();
  const data = taskSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    dueAt: formData.get("dueAt") ?? undefined,
    assigneeId: formData.get("assigneeId") ?? undefined,
    priority: formData.get("priority") ?? "NORMAL",
    recurrence: formData.get("recurrence") ?? "NONE",
  });

  const task = await db.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      assigneeId: data.assigneeId || null,
      priority: data.priority,
      recurrence: data.recurrence,
      createdById: user.id,
      status: "OPEN",
    },
  });
  await audit({ userId: user.id, entity: "Task", entityId: task.id, action: "CREATE", after: task });
  revalidatePath("/tasks");
}

export async function setTaskStatus(id: string, status: string) {
  const user = await requireUser();
  if (!TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number])) throw new Error("Ungültiger Status");
  const existing = await db.task.findUnique({ where: { id } });
  if (!existing) throw new Error("Aufgabe nicht gefunden");
  const updated = await db.task.update({
    where: { id },
    data: {
      status,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });

  // Bei wiederkehrender Aufgabe: Nächste Aufgabe automatisch anlegen
  if (status === "DONE" && existing.recurrence !== "NONE" && existing.dueAt) {
    const nextDue = new Date(existing.dueAt);
    if (existing.recurrence === "DAILY") nextDue.setDate(nextDue.getDate() + 1);
    if (existing.recurrence === "WEEKLY") nextDue.setDate(nextDue.getDate() + 7);
    if (existing.recurrence === "MONTHLY") nextDue.setMonth(nextDue.getMonth() + 1);
    await db.task.create({
      data: {
        title: existing.title,
        description: existing.description,
        dueAt: nextDue,
        assigneeId: existing.assigneeId,
        priority: existing.priority,
        recurrence: existing.recurrence,
        createdById: existing.createdById,
        status: "OPEN",
      },
    });
  }

  await audit({ userId: user.id, entity: "Task", entityId: id, action: "UPDATE", before: existing, after: updated });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const user = await requireUser();
  const existing = await db.task.findUnique({ where: { id } });
  if (!existing) return;
  await db.task.delete({ where: { id } });
  await audit({ userId: user.id, entity: "Task", entityId: id, action: "DELETE", before: existing });
  revalidatePath("/tasks");
}
