"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";

const setupSchema = z.object({
  name: z.string().min(1, "Name fehlt"),
  email: z.string().email("Ungültige E-Mail").transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8, "Mindestens 8 Zeichen"),
  withDemo: z.boolean().default(true),
});

export async function setupFirstAdmin(formData: FormData) {
  // Sicherheitsprüfung: Setup nur möglich, wenn noch kein Admin existiert
  const existingAdmin = await db.user.count({ where: { role: "ADMIN" } });
  if (existingAdmin > 0) {
    redirect("/login");
  }

  const data = setupSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    withDemo: formData.get("withDemo") === "on",
  });

  const passwordHash = await bcrypt.hash(data.password, 10);
  const admin = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: "ADMIN",
      active: true,
    },
  });

  if (data.withDemo) {
    await seedDemoData(admin.id);
  }

  // Direkt einloggen
  await signIn("credentials", {
    email: data.email,
    password: data.password,
    redirectTo: "/dashboard",
  });
}

async function seedDemoData(adminId: string) {
  // Beispiel-Mitarbeiter
  const empPassword = await bcrypt.hash("mitarbeiter1234", 10);
  const employee = await db.user.create({
    data: {
      email: "anna@beispiel.de",
      name: "Anna Schmidt (Beispiel)",
      passwordHash: empPassword,
      role: "EMPLOYEE",
      hourlyWageCt: 1350,
      active: true,
    },
  });

  await db.user.create({
    data: {
      email: "tim@beispiel.de",
      name: "Tim Müller (Beispiel)",
      passwordHash: empPassword,
      role: "HELPER",
      hourlyWageCt: 1200,
      active: true,
    },
  });

  // Lieferant
  const lieferant = await db.supplier.create({
    data: {
      name: "Edeka Großmarkt (Beispiel)",
      contactName: "Herr Berger",
      email: "bestellungen@edeka-grossmarkt.de",
      phone: "+49 30 12345678",
    },
  });

  // Artikel
  const products = [
    { name: "Cola 0,5L", category: "Getränke", unit: "Stück", purchaseCt: 65, sellCt: 250, min: 24 },
    { name: "Wasser still 0,5L", category: "Getränke", unit: "Stück", purchaseCt: 30, sellCt: 200, min: 24 },
    { name: "Pommes Frites (Beutel 2,5kg)", category: "Snacks", unit: "Packung", purchaseCt: 750, sellCt: 0, min: 4, trackExpiry: true },
    { name: "Bratwurst", category: "Snacks", unit: "Stück", purchaseCt: 120, sellCt: 350, min: 30, trackExpiry: true },
    { name: "Eis am Stiel", category: "Eis", unit: "Stück", purchaseCt: 80, sellCt: 200, min: 50, trackExpiry: true },
    { name: "Schwimmbrille", category: "Sonstiges", unit: "Stück", purchaseCt: 500, sellCt: 1290, min: 5 },
  ];

  for (const p of products) {
    await db.product.create({
      data: {
        name: p.name,
        category: p.category,
        unit: p.unit,
        vatRate: 0.19,
        purchasePriceCt: p.purchaseCt,
        sellPriceCt: p.sellCt,
        minStock: p.min,
        trackExpiry: p.trackExpiry ?? false,
        supplierId: lieferant.id,
      },
    });
  }

  // Checklisten
  await db.checklistTemplate.create({
    data: {
      name: "Öffnungs-Checkliste",
      frequency: "Täglich beim Öffnen",
      items: {
        create: [
          { text: "Kühlschränke prüfen (Temperatur unter 7°C)", orderIdx: 0 },
          { text: "Kasse auffüllen / Wechselgeld prüfen", orderIdx: 1 },
          { text: "Frittenfett-Stand prüfen", orderIdx: 2 },
          { text: "Eismaschine einschalten", orderIdx: 3 },
          { text: "Theken-Display dekorieren", orderIdx: 4 },
        ],
      },
    },
  });

  await db.checklistTemplate.create({
    data: {
      name: "Schließ-Checkliste",
      frequency: "Täglich beim Schließen",
      items: {
        create: [
          { text: "Kasse zählen + Tagesabschluss", orderIdx: 0 },
          { text: "Frittenfett abkühlen lassen", orderIdx: 1 },
          { text: "Eismaschine reinigen", orderIdx: 2 },
          { text: "Müll rausbringen", orderIdx: 3 },
          { text: "Theke wischen", orderIdx: 4 },
          { text: "Türen und Fenster verschließen", orderIdx: 5 },
        ],
      },
    },
  });

  await db.checklistTemplate.create({
    data: {
      name: "Rundgang / vor Rausgehen",
      frequency: "Bei jedem Rausgehen",
      items: {
        create: [
          { text: "Müll an der Theke geleert", orderIdx: 0 },
          { text: "Theke abgewischt", orderIdx: 1 },
          { text: "Vorrat geprüft (Eis, Getränke)", orderIdx: 2 },
          { text: "Kasse abgeschlossen", orderIdx: 3 },
        ],
      },
    },
  });

  // Beispiel-Aufgaben
  await db.task.createMany({
    data: [
      {
        title: "Kühltheke gründlich reinigen",
        description: "Komplett ausräumen, mit Desinfektionsmittel reinigen",
        priority: "HIGH",
        recurrence: "WEEKLY",
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        assigneeId: employee.id,
        createdById: adminId,
        status: "OPEN",
      },
      {
        title: "Bestellung Edeka aufgeben",
        description: "Cola, Pommes, Bratwurst nachbestellen",
        priority: "NORMAL",
        recurrence: "WEEKLY",
        dueAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        createdById: adminId,
        status: "OPEN",
      },
    ],
  });

  // Schichten für die nächsten 7 Tage
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    await db.shift.create({
      data: { date, startTime: "10:00", endTime: "15:00", role: "Kasse", requiredCount: 1, createdById: adminId },
    });
    await db.shift.create({
      data: { date, startTime: "15:00", endTime: "20:00", role: "Theke", requiredCount: 2, createdById: adminId },
    });
  }
}
