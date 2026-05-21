"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  frequency: z.string().optional(),
  items: z.array(z.string().min(1)).min(1, "Mindestens ein Punkt nötig"),
});

export async function createTemplate(formData: FormData) {
  const user = await requireRole("ADMIN", "SHIFT_LEAD");
  const items = formData.getAll("item").map(String).filter((s) => s.trim().length > 0);
  const data = templateSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    frequency: formData.get("frequency") ?? undefined,
    items,
  });

  const template = await db.checklistTemplate.create({
    data: {
      name: data.name,
      description: data.description || null,
      frequency: data.frequency || null,
      items: {
        create: data.items.map((text, idx) => ({ text, orderIdx: idx })),
      },
    },
  });
  await audit({ userId: user.id, entity: "ChecklistTemplate", entityId: template.id, action: "CREATE", after: template });
  revalidatePath("/checklists");
  redirect("/checklists");
}

export async function startRun(templateId: string) {
  const user = await requireUser();
  const run = await db.checklistRun.create({
    data: { templateId, userId: user.id },
  });
  revalidatePath("/checklists");
  redirect(`/checklists/run/${run.id}`);
}

const itemUpdateSchema = z.object({
  runId: z.string(),
  itemId: z.string(),
  checked: z.boolean(),
  note: z.string().optional(),
});

export async function toggleRunItem(runId: string, itemId: string, checked: boolean) {
  const user = await requireUser();
  const data = itemUpdateSchema.parse({ runId, itemId, checked });
  await db.checklistRunItem.upsert({
    where: { runId_itemId: { runId: data.runId, itemId: data.itemId } },
    create: {
      runId: data.runId,
      itemId: data.itemId,
      checked: data.checked,
      checkedAt: data.checked ? new Date() : null,
    },
    update: {
      checked: data.checked,
      checkedAt: data.checked ? new Date() : null,
    },
  });
  revalidatePath(`/checklists/run/${runId}`);
  return { ok: true, userId: user.id };
}

export async function completeRun(runId: string) {
  const user = await requireUser();
  const run = await db.checklistRun.findUnique({
    where: { id: runId },
    include: { template: { include: { items: true } }, items: true },
  });
  if (!run) throw new Error("Run nicht gefunden");

  // Alle Items als unchecked anlegen, die noch nicht existieren, mit checked=false
  // Hier prüfen wir, ob alle Pflicht-Items abgehakt sind
  const checkedItemIds = new Set(run.items.filter((i) => i.checked).map((i) => i.itemId));
  const allChecked = run.template.items.every((i) => checkedItemIds.has(i.id));
  if (!allChecked) {
    throw new Error("Bitte alle Punkte abhaken oder Lauf abbrechen");
  }

  await db.checklistRun.update({
    where: { id: runId },
    data: { completedAt: new Date() },
  });
  await audit({ userId: user.id, entity: "ChecklistRun", entityId: runId, action: "UPDATE", after: { completed: true } });
  revalidatePath("/checklists");
  redirect("/checklists");
}

export async function deleteTemplate(id: string) {
  const user = await requireRole("ADMIN");
  await db.checklistTemplate.delete({ where: { id } });
  await audit({ userId: user.id, entity: "ChecklistTemplate", entityId: id, action: "DELETE" });
  revalidatePath("/checklists");
}
