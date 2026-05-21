import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { STOCK_MOVEMENT_TYPES, STOCK_MOVEMENT_LABELS } from "@/lib/enums";
import { formatDateDE } from "@/lib/utils";
import { bookMovement } from "../actions";

export default async function MovementPage() {
  const [products, recent] = await Promise.all([
    db.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.stockMovement.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true, unit: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bestandsbuchung</h1>
        <p className="text-muted-foreground">Wareneingang, Verbrauch, Inventur-Korrektur, Verworfen</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neue Buchung</CardTitle>
          <CardDescription>Bestand erhöht/reduziert sich automatisch</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={bookMovement} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Artikel *</Label>
              <Select id="productId" name="productId" required defaultValue="">
                <option value="" disabled>
                  — Artikel wählen —
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit})
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Art *</Label>
                <Select id="type" name="type" defaultValue="RECEIPT">
                  {STOCK_MOVEMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {STOCK_MOVEMENT_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qty">Menge *</Label>
                <Input id="qty" name="qty" type="number" step="0.01" min="0.01" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Grund / Notiz</Label>
              <Input id="reason" name="reason" placeholder="z.B. Lieferung Edeka, Inventur, MHD abgelaufen" />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Buchen</Button>
              <Button asChild variant="outline">
                <Link href="/inventory">Abbrechen</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Letzte Buchungen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Wann</th>
                <th className="px-4 py-2 font-medium">Artikel</th>
                <th className="px-4 py-2 font-medium">Art</th>
                <th className="px-4 py-2 font-medium">Menge</th>
                <th className="px-4 py-2 font-medium">Mitarbeiter</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="px-4 py-2 text-muted-foreground">{formatDateDE(m.createdAt, true)}</td>
                  <td className="px-4 py-2">{m.product.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {STOCK_MOVEMENT_LABELS[m.type as keyof typeof STOCK_MOVEMENT_LABELS]}
                  </td>
                  <td className="px-4 py-2">
                    {m.type === "RECEIPT" || m.type === "ADJUSTMENT" ? "+" : "−"}
                    {m.qty} {m.product.unit}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{m.user.name}</td>
                </tr>
              ))}
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    Noch keine Buchungen.
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
