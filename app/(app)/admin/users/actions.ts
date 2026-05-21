"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { USER_ROLES } from "@/lib/enums";
import { parseEuroToCents } from "@/lib/money";

const userSchema = z.object({
  name: z.string().min(1, "Name fehlt"),
  email: z.string().email("Ungültige E-Mail").transform((v) => v.toLowerCase().trim()),
  role: z.enum(USER_ROLES),
  hourlyWage: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().default(true),
});

export async function createUser(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const data = userSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    hourlyWage: formData.get("hourlyWage") ?? undefined,
    phone: formData.get("phone") ?? undefined,
    notes: formData.get("notes") ?? undefined,
    active: formData.get("active") === "on",
  });
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    throw new Error("Passwort muss mindestens 8 Zeichen haben");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      hourlyWageCt: data.hourlyWage ? parseEuroToCents(data.hourlyWage) : null,
      phone: data.phone || null,
      notes: data.notes || null,
      active: data.active,
      passwordHash,
    },
  });

  await audit({ userId: admin.id, entity: "User", entityId: user.id, action: "CREATE", after: { ...user, passwordHash: "[REDACTED]" } });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUser(id: string, formData: FormData) {
  const admin = await requireRole("ADMIN");
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) throw new Error("Mitarbeiter nicht gefunden");

  const data = userSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    hourlyWage: formData.get("hourlyWage") ?? undefined,
    phone: formData.get("phone") ?? undefined,
    notes: formData.get("notes") ?? undefined,
    active: formData.get("active") === "on",
  });

  const updated = await db.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      hourlyWageCt: data.hourlyWage ? parseEuroToCents(data.hourlyWage) : null,
      phone: data.phone || null,
      notes: data.notes || null,
      active: data.active,
    },
  });

  const newPassword = String(formData.get("password") ?? "");
  if (newPassword.length > 0) {
    if (newPassword.length < 8) throw new Error("Passwort muss mindestens 8 Zeichen haben");
    await db.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
  }

  await audit({
    userId: admin.id,
    entity: "User",
    entityId: id,
    action: "UPDATE",
    before: { ...existing, passwordHash: "[REDACTED]" },
    after: { ...updated, passwordHash: "[REDACTED]" },
  });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}
