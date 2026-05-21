import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { centsToEuroString } from "@/lib/money";
import { formatDateDE } from "@/lib/utils";
import { addInvoiceLine } from "../actions";
import { FileText, ArrowLeft } from "lucide-react";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, products] = await Promise.all([
    db.invoice.findUnique({
      where: { id },
      include: {
        supplier: { select: { name: true } },
        uploadedBy: { select: { name: true } },
        file: true,
        lines: { include: { product: { select: { name: true, unit: true } } } },
      },
    }),
    db.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!invoice) notFound();

  const linesTotal = invoice.lines.reduce((acc, l) => acc + l.unitPriceCt * l.qty, 0);
  const addLine = addInvoiceLine.bind(null, id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/purchases">
            <ArrowLeft className="h-4 w-4" /> Zurück zur Liste
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Rechnung {invoice.invoiceNumber ?? "(ohne Nr.)"}</h1>
        <p className="text-muted-foreground">
          {invoice.supplier?.name ?? "—"} • {formatDateDE(invoice.invoiceDate)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Brutto</div>
            <div className="text-xl font-semibold">{centsToEuroString(invoice.totalGrossCt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Netto</div>
            <div className="text-xl font-semibold">{centsToEuroString(invoice.totalNetCt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Positionen-Summe</div>
            <div className="text-xl font-semibold">{centsToEuroString(linesTotal)}</div>
          </CardContent>
        </Card>
      </div>

      {invoice.file ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rechnungs-Datei</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={invoice.file.storedPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <FileText className="h-5 w-5" />
              {invoice.file.originalName}
            </a>
            <p className="mt-1 text-xs text-muted-foreground">
              SHA-256: {invoice.file.sha256?.slice(0, 16)}… (unveränderbar archiviert)
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Positionen ({invoice.lines.length})</CardTitle>
          <CardDescription>Einzelposten der Rechnung</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {invoice.lines.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Noch keine Positionen erfasst.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Beschreibung</th>
                  <th className="px-4 py-2 font-medium">Artikel</th>
                  <th className="px-4 py-2 font-medium">Menge</th>
                  <th className="px-4 py-2 font-medium">EP</th>
                  <th className="px-4 py-2 font-medium">MwSt.</th>
                  <th className="px-4 py-2 font-medium">Summe</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{l.description}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {l.product ? l.product.name : <Badge variant="outline">Keiner</Badge>}
                    </td>
                    <td className="px-4 py-2">
                      {l.qty} {l.product?.unit ?? ""}
                    </td>
                    <td className="px-4 py-2">{centsToEuroString(l.unitPriceCt)}</td>
                    <td className="px-4 py-2 text-muted-foreground">{Math.round(l.vatRate * 100)}%</td>
                    <td className="px-4 py-2 font-medium">{centsToEuroString(l.unitPriceCt * l.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Position hinzufügen</CardTitle>
          <CardDescription>Optional direkt als Wareneingang buchen</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addLine} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Beschreibung *</Label>
              <Input id="description" name="description" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productId">Artikel zuordnen</Label>
              <Select id="productId" name="productId" defaultValue="">
                <option value="">— Keiner —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Menge *</Label>
              <Input id="qty" name="qty" type="number" step="0.01" min="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">EP (€) *</Label>
              <Input id="unitPrice" name="unitPrice" placeholder="z.B. 1,50" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatRate">MwSt.</Label>
              <Select id="vatRate" name="vatRate" defaultValue="0.19">
                <option value="0.19">19%</option>
                <option value="0.07">7%</option>
                <option value="0">0%</option>
              </Select>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input id="bookStock" name="bookStock" type="checkbox" className="h-4 w-4" defaultChecked />
              <Label htmlFor="bookStock">Direkt als Wareneingang ins Lager buchen</Label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Position hinzufügen</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
