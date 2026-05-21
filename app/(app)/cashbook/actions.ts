"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { calculateCashTotal, parseEuroToCents, type DenominationKey, ALL_DENOMINATIONS } from "@/lib/money";
import { CASH_TX_TYPES } from "@/lib/enums";

export async function saveCashCount(formData: FormData) {
  const user = await requireUser();

  const counts: Record<DenominationKey, number> = {} as Record<DenominationKey, number>;
  for (const d of ALL_DENOMINATIONS) {
    counts[d.key] = Number(formData.get(d.key) ?? 0) || 0;
  }
  const total = calculateCashTotal(counts);
  const expectedStr = String(formData.get("expected") ?? "");
  const expectedCt = expectedStr ? parseEuroToCents(expectedStr) : null;
  const diffCt = expectedCt != null ? total - expectedCt : null;
  const isDailyClose = formData.get("isDailyClose") === "on";
  const notes = String(formData.get("notes") ?? "") || null;

  const count = await db.cashCount.create({
    data: {
      ...counts,
      totalCt: total,
      expectedCt,
      diffCt,
      isDailyClose,
      notes,
      userId: user.id,
    },
  });
  await audit({ userId: user.id, entity: "CashCount", entityId: count.id, action: "CREATE", after: count });
  revalidatePath("/cashbook");
  revalidatePath("/dashboard");
  redirect("/cashbook");
}

const txSchema = z.object({
  type: z.enum(CASH_TX_TYPES),
  amount: z.string().min(1),
  reason: z.string().min(1),
  notes: z.string().optional(),
});

export async function recordCashTransaction(formData: FormData) {
  const user = await requireUser();
  const data = txSchema.parse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
    notes: formData.get("notes") ?? undefined,
  });
  const amountCt = parseEuroToCents(data.amount);
  if (amountCt == null || amountCt <= 0) throw new Error("Ungültiger Betrag");
  // Vorzeichen-Logik: WITHDRAWAL → negativ
  const signedAmount = data.type === "WITHDRAWAL" ? -amountCt : amountCt;

  const tx = await db.cashTransaction.create({
    data: {
      type: data.type,
      amountCt: signedAmount,
      reason: data.reason,
      userId: user.id,
      notes: data.notes || null,
    },
  });
  await audit({ userId: user.id, entity: "CashTransaction", entityId: tx.id, action: "CREATE", after: tx });
  revalidatePath("/cashbook");
}
