import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  // Admin
  const adminPassword = await bcrypt.hash("admin1234", 10);
  const admin = await db.user.upsert({
    where: { email: "admin@freibad.de" },
    update: {},
    create: {
      email: "admin@freibad.de",
      name: "Admin Inhaber",
      passwordHash: adminPassword,
      role: "ADMIN",
      hourlyWageCt: 0,
      active: true,
    },
  });

  // Beispiel-Mitarbeiter
  const empPassword = await bcrypt.hash("mitarbeiter1234", 10);
  const employee = await db.user.upsert({
    where: { email: "anna@freibad.de" },
    update: {},
    create: {
      email: "anna@freibad.de",
      name: "Anna Schmidt",
      passwordHash: empPassword,
      role: "EMPLOYEE",
      hourlyWageCt: 1350,
      active: true,
    },
  });

  const helper = await db.user.upsert({
    where: { email: "tim@freibad.de" },
    update: {},
    create: {
      email: "tim@freibad.de",
      name: "Tim Müller",
      passwordHash: empPassword,
      role: "HELPER",
      hourlyWageCt: 1200,
      active: true,
    },
  });

  // Beispiel-Lieferant
  const lieferant = await db.supplier.upsert({
    where: { id: "seed-supplier-edeka" },
    update: {},
    create: {
      id: "seed-supplier-edeka",
      name: "Edeka Großmarkt",
      contactName: "Herr Berger",
      email: "bestellungen@edeka-grossmarkt.de",
      phone: "+49 30 12345678",
      customerNumber: "K-9182",
    },
  });

  // Beispiel-Artikel
  const products = [
    { name: "Cola 0,5L", category: "Getränke", unit: "Stück", purchaseCt: 65, sellCt: 250, min: 24 },
    { name: "Wasser still 0,5L", category: "Getränke", unit: "Stück", purchaseCt: 30, sellCt: 200, min: 24 },
    { name: "Pommes Frites (Beutel 2,5kg)", category: "Snacks", unit: "Packung", purchaseCt: 750, sellCt: 0, min: 4, trackExpiry: true },
    { name: "Bratwurst", category: "Snacks", unit: "Stück", purchaseCt: 120, sellCt: 350, min: 30, trackExpiry: true },
    { name: "Eis am Stiel", category: "Eis", unit: "Stück", purchaseCt: 80, sellCt: 200, min: 50, trackExpiry: true },
    { name: "Schwimmbrille", category: "Sonstiges", unit: "Stück", purchaseCt: 500, sellCt: 1290, min: 5 },
  ];

  for (const p of products) {
    await db.product.upsert({
      where: { sku: `SEED-${p.name}` },
      update: {},
      create: {
        sku: `SEED-${p.name}`,
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

  // Beispiel-Checklisten
  const opening = await db.checklistTemplate.create({
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

  const closing = await db.checklistTemplate.create({
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

  const round = await db.checklistTemplate.create({
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
        createdById: admin.id,
        status: "OPEN",
      },
      {
        title: "Bestellung Edeka aufgeben",
        description: "Cola, Pommes, Bratwurst nachbestellen",
        priority: "NORMAL",
        recurrence: "WEEKLY",
        dueAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        createdById: admin.id,
        status: "OPEN",
      },
      {
        title: "Eismaschine entkalken",
        description: "Wartungsplan Hersteller folgen",
        priority: "LOW",
        recurrence: "MONTHLY",
        createdById: admin.id,
        status: "OPEN",
      },
    ],
  });

  // Beispiel-Schichten für die nächsten 7 Tage
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    await db.shift.create({
      data: {
        date,
        startTime: "10:00",
        endTime: "15:00",
        role: "Kasse",
        requiredCount: 1,
        createdById: admin.id,
      },
    });
    await db.shift.create({
      data: {
        date,
        startTime: "15:00",
        endTime: "20:00",
        role: "Theke",
        requiredCount: 2,
        createdById: admin.id,
      },
    });
  }

  // Beispiel-Wareneingang
  const cola = await db.product.findFirst({ where: { name: "Cola 0,5L" } });
  if (cola) {
    await db.stockMovement.create({
      data: {
        productId: cola.id,
        type: "RECEIPT",
        qty: 48,
        reason: "Erstauffüllung",
        userId: admin.id,
      },
    });
  }

  console.log("✅ Seed fertig!");
  console.log("");
  console.log("Login:");
  console.log("  Admin:        admin@freibad.de / admin1234");
  console.log("  Mitarbeiter:  anna@freibad.de  / mitarbeiter1234");
  console.log("  Aushilfe:     tim@freibad.de   / mitarbeiter1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
