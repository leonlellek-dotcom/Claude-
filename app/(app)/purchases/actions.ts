"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { saveUploadedFile } from "@/lib/storage";
import { parseEuroToCents } from "@/lib/money";

const invoiceSchema = z.object({
  supplierId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  totalNet: z.string().optional(),
  totalGross: z.string().optional(),
  notes: z.string().optional(),
});

export async function uploadInvoice(formData: FormData) {
  const user = await requireUser();
  const data = invoiceSchema.parse({
    supplierId: formData.get("supplierId") ?? undefined,
    invoiceNumber: formData.get("invoiceNumber") ?? undefined,
    invoiceDate: formData.get("invoiceDate") ?? undefined,
    totalNet: formData.get("totalNet") ?? undefined,
    totalGross: formData.get("totalGross") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });

  const file = formData.get("file");
  let fileId: string | null = null;
  if (file instanceof File && file.size > 0) {
    const saved = await saveUploadedFile({ file, kind: "invoice", uploadedById: user.id });
    fileId = saved.id;
  }

  const invoice = await db.invoice.create({
    data: {
      supplierId: data.supplierId || null,
      invoiceNumber: data.invoiceNumber || null,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
      totalNetCt: data.totalNet ? parseEuroToCents(data.totalNet) : null,
      totalGrossCt: data.totalGross ? parseEuroToCents(data.totalGross) : null,
      fileId,
      uploadedById: user.id,
      notes: data.notes || null,
    },
  });
  await audit({ userId: user.id, entity: "Invoice", entityId: invoice.id, action: "CREATE", after: invoice });
  revalidatePath("/purchases");
  redirect(`/purchases/${invoice.id}`);
}

const lineSchema = z.object({
  invoiceId: z.string(),
  productId: z.string().optional(),
  description: z.string().min(1),
  qty: z.coerce.number().positive(),
  unitPrice: z.string().min(1),
  vatRate: z.coerce.number().min(0).max(1),
  bookStock: z.boolean().default(false),
});

export async function addInvoiceLine(invoiceId: string, formData: FormData) {
  const user = await requireUser();
  const data = lineSchema.parse({
    invoiceId,
    productId: formData.get("productId") ?? undefined,
    description: formData.get("description"),
    qty: formData.get("qty"),
    unitPrice: formData.get("unitPrice"),
    vatRate: formData.get("vatRate") ?? 0.19,
    bookStock: formData.get("bookStock") === "on",
  });

  const unitPriceCt = parseEuroToCents(data.unitPrice) ?? 0;

  const line = await db.invoiceLine.create({
    data: {
      invoiceId: data.invoiceId,
      productId: data.productId || null,
      description: data.description,
      qty: data.qty,
      unitPriceCt,
      vatRate: data.vatRate,
    },
  });

  // Optional: Direkt als Wareneingang buchen
  if (data.bookStock && data.productId) {
    await db.stockMovement.create({
      data: {
        productId: data.productId,
        type: "RECEIPT",
        qty: data.qty,
        reason: `Wareneingang aus Rechnung ${invoiceId}`,
        userId: user.id,
        invoiceId: data.invoiceId,
      },
    });
  }

  await audit({ userId: user.id, entity: "InvoiceLine", entityId: line.id, action: "CREATE", after: line });
  revalidatePath(`/purchases/${invoiceId}`);
}
