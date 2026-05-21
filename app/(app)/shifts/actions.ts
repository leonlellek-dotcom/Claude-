"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, canManageShifts } from "@/lib/auth";
import { audit } from "@/lib/audit";
import type { UserRole } from "@/lib/enums";

const shiftSchema = z.object({
  date: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  role: z.string().optional(),
  requiredCount: z.coerce.number().int().min(1).max(20),
  notes: z.string().optional(),
});

export async function createShift(formData: FormData) {
  const user = await requireUser();
  if (!canManageShifts(user.role as UserRole)) throw new Error("FORBIDDEN");

  const data = shiftSchema.parse({
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    role: formData.get("role") ?? undefined,
    requiredCount: formData.get("requiredCount") ?? 1,
    notes: formData.get("notes") ?? undefined,
  });

  const shift = await db.shift.create({
    data: {
      date: new Date(data.date + "T00:00:00"),
      startTime: data.startTime,
      endTime: data.endTime,
      role: data.role || null,
      requiredCount: data.requiredCount,
      notes: data.notes || null,
      createdById: user.id,
    },
  });
  await audit({ userId: user.id, entity: "Shift", entityId: shift.id, action: "CREATE", after: shift });
  revalidatePath("/shifts");
}

export async function deleteShift(id: string) {
  const user = await requireUser();
  if (!canManageShifts(user.role as UserRole)) throw new Error("FORBIDDEN");
  const existing = await db.shift.findUnique({ where: { id } });
  if (!existing) throw new Error("Schicht nicht gefunden");
  await db.shift.delete({ where: { id } });
  await audit({ userId: user.id, entity: "Shift", entityId: id, action: "DELETE", before: existing });
  revalidatePath("/shifts");
}

export async function signUpForShift(shiftId: string) {
  const user = await requireUser();
  const existing = await db.shiftAssignment.findUnique({
    where: { shiftId_userId: { shiftId, userId: user.id } },
  });
  if (existing) {
    if (existing.status === "CANCELLED") {
      await db.shiftAssignment.update({
        where: { id: existing.id },
        data: { status: "SIGNED_UP" },
      });
    }
  } else {
    const assignment = await db.shiftAssignment.create({
      data: { shiftId, userId: user.id, status: "SIGNED_UP" },
    });
    await audit({ userId: user.id, entity: "ShiftAssignment", entityId: assignment.id, action: "CREATE", after: assignment });
  }
  revalidatePath("/shifts");
}

export async function cancelAssignment(assignmentId: string) {
  const user = await requireUser();
  const existing = await db.shiftAssignment.findUnique({ where: { id: assignmentId } });
  if (!existing) throw new Error("Eintrag nicht gefunden");
  // Mitarbeiter darf nur sich selbst absagen; Admin/SL dürfen alle
  if (existing.userId !== user.id && !canManageShifts(user.role as UserRole)) {
    throw new Error("FORBIDDEN");
  }
  await db.shiftAssignment.update({ where: { id: assignmentId }, data: { status: "CANCELLED" } });
  await audit({ userId: user.id, entity: "ShiftAssignment", entityId: assignmentId, action: "UPDATE", before: existing, after: { ...existing, status: "CANCELLED" } });
  revalidatePath("/shifts");
}

const assignSchema = z.object({
  shiftId: z.string(),
  userId: z.string(),
});

export async function adminAssignUser(formData: FormData) {
  const user = await requireUser();
  if (!canManageShifts(user.role as UserRole)) throw new Error("FORBIDDEN");
  const data = assignSchema.parse({
    shiftId: formData.get("shiftId"),
    userId: formData.get("userId"),
  });
  const existing = await db.shiftAssignment.findUnique({
    where: { shiftId_userId: { shiftId: data.shiftId, userId: data.userId } },
  });
  if (existing) {
    await db.shiftAssignment.update({ where: { id: existing.id }, data: { status: "CONFIRMED" } });
  } else {
    await db.shiftAssignment.create({
      data: { shiftId: data.shiftId, userId: data.userId, status: "CONFIRMED" },
    });
  }
  revalidatePath("/shifts");
}
