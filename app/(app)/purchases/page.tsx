import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { centsToEuroString } from "@/lib/money";
import { formatDateDE } from "@/lib/utils";
import { Plus, FileText } from "lucide-react";

export default async function PurchasesPage() {
  const invoices = await db.invoice.findMany({
    orderBy: { bookedAt: "desc" },
    take: 100,
    include: {
      supplier: { select: { name: true } },
      uploadedBy: { select: { name: true } },
      file: { select: { id: true, originalName: true } },
      _count: { select: { lines: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rechnungen</h1>
          <p className="text-muted-foreground">Eingangsrechnungen archivieren & buchen</p>
        </div>
        <Button asChild>
          <Link href="/purchases/new">
            <Plus className="h-4 w-4" /> Rechnung hochladen
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Rechnungen ({invoices.length})</CardTitle>
          <CardDescription>Klicke auf eine Rechnung für Details & Positionen</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">RG-Nr</th>
                <th className="px-4 py-2 font-medium">Datum</th>
                <th className="px-4 py-2 font-medium">Lieferant</th>
                <th className="px-4 py-2 font-medium">Brutto</th>
                <th className="px-4 py-2 font-medium">Positionen</th>
                <th className="px-4 py-2 font-medium">Datei</th>
                <th className="px-4 py-2 font-medium">Erfasst von</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-accent/30">
                  <td className="px-4 py-2">
                    <Link href={`/purchases/${inv.id}`} className="font-medium hover:underline">
                      {inv.invoiceNumber ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{formatDateDE(inv.invoiceDate)}</td>
                  <td className="px-4 py-2">{inv.supplier?.name ?? <Badge variant="outline">Ohne</Badge>}</td>
                  <td className="px-4 py-2 font-medium">{centsToEuroString(inv.totalGrossCt)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{inv._count.lines}</td>
                  <td className="px-4 py-2">
                    {inv.file ? (
                      <a href={`/api/files/${inv.file.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <FileText className="h-4 w-4" /> Datei
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{inv.uploadedBy.name}</td>
                </tr>
              ))}
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Noch keine Rechnungen.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
