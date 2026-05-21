"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { parseEuroToCents } from "@/lib/money";
import { STOCK_MOVEMENT_TYPES } from "@/lib/enums";

const productSchema = z.object({
  name: z.string().min(1, "Name fehlt"),
  sku: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().min(1),
  vatRate: z.coerce.number().min(0).max(1),
  purchasePrice: z.string().optional(),
  sellPrice: z.string().optional(),
  minStock: z.coerce.number().min(0),
  supplierId: z.string().optional(),
  trackExpiry: z.boolean().default(false),
  notes: z.string().optional(),
});

export async function createProduct(formData: FormData) {
  const user = await requireRole("ADMIN", "SHIFT_LEAD");
  const data = productSchema.parse({
    name: formData.get("name"),
    sku: formData.get("sku") ?? undefined,
    category: formData.get("category") ?? undefined,
    unit: formData.get("unit") ?? "Stück",
    vatRate: formData.get("vatRate") ?? 0.19,
    purchasePrice: formData.get("purchasePrice") ?? undefined,
    sellPrice: formData.get("sellPrice") ?? undefined,
    minStock: formData.get("minStock") ?? 0,
    supplierId: formData.get("supplierId") ?? undefined,
    trackExpiry: formData.get("trackExpiry") === "on",
    notes: formData.get("notes") ?? undefined,
  });

  const product = await db.product.create({
    data: {
      name: data.name,
      sku: data.sku || null,
      category: data.category || null,
      unit: data.unit,
      vatRate: data.vatRate,
      purchasePriceCt: data.purchasePrice ? parseEuroToCents(data.purchasePrice) : null,
      sellPriceCt: data.sellPrice ? parseEuroToCents(data.sellPrice) : null,
      minStock: data.minStock,
      supplierId: data.supplierId || null,
      trackExpiry: data.trackExpiry,
      notes: data.notes || null,
    },
  });
  await audit({ userId: user.id, entity: "Product", entityId: product.id, action: "CREATE", after: product });
  revalidatePath("/inventory");
  redirect("/inventory");
}

const movementSchema = z.object({
  productId: z.string().min(1, "Artikel wählen"),
  type: z.enum(STOCK_MOVEMENT_TYPES),
  qty: z.coerce.number().positive("Menge muss > 0 sein"),
  reason: z.string().optional(),
});

export async function bookMovement(formData: FormData) {
  const user = await requireUser();
  const data = movementSchema.parse({
    productId: formData.get("productId"),
    type: formData.get("type"),
    qty: formData.get("qty"),
    reason: formData.get("reason") ?? undefined,
  });

  const m = await db.stockMovement.create({
    data: {
      productId: data.productId,
      type: data.type,
      qty: data.qty,
      reason: data.reason || null,
      userId: user.id,
    },
  });
  await audit({ userId: user.id, entity: "StockMovement", entityId: m.id, action: "CREATE", after: m });
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  redirect("/inventory");
}

export async function createSupplier(formData: FormData) {
  const user = await requireRole("ADMIN", "SHIFT_LEAD");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name fehlt");
  const s = await db.supplier.create({
    data: {
      name,
      contactName: String(formData.get("contactName") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      address: String(formData.get("address") ?? "") || null,
      customerNumber: String(formData.get("customerNumber") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
    },
  });
  await audit({ userId: user.id, entity: "Supplier", entityId: s.id, action: "CREATE", after: s });
  revalidatePath("/inventory/suppliers");
  revalidatePath("/purchases/suppliers");
  redirect("/inventory/suppliers");
}
