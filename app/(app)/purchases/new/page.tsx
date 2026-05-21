import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { uploadInvoice } from "../actions";

export default async function NewInvoicePage() {
  const suppliers = await db.supplier.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rechnung hochladen</h1>
        <p className="text-muted-foreground">PDF oder Foto + Eckdaten</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rechnungsdaten</CardTitle>
          <CardDescription>Pflicht: nur Datei. Positionen kommen im nächsten Schritt.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={uploadInvoice} className="space-y-4" encType="multipart/form-data">
            <div className="space-y-2">
              <Label htmlFor="file">Rechnungs-Datei (PDF, JPG, PNG)</Label>
              <Input id="file" name="file" type="file" accept="application/pdf,image/*" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplierId">Lieferant</Label>
                <Select id="supplierId" name="supplierId" defaultValue="">
                  <option value="">— Bitte wählen —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground">
                  Noch nicht da?{" "}
                  <Link href="/inventory/suppliers" className="underline">
                    Lieferant anlegen
                  </Link>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Rechnungsnummer</Label>
                <Input id="invoiceNumber" name="invoiceNumber" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Rechnungsdatum</Label>
                <Input id="invoiceDate" name="invoiceDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalGross">Summe brutto (€)</Label>
                <Input id="totalGross" name="totalGross" placeholder="z.B. 123,45" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalNet">Summe netto (€)</Label>
                <Input id="totalNet" name="totalNet" placeholder="optional" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Hochladen & weiter</Button>
              <Button asChild variant="outline">
                <Link href="/purchases">Abbrechen</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
