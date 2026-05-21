import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { UserRole } from "@/lib/enums";
import { createProduct } from "../../actions";

export default async function NewProductPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role as UserRole;
  if (role !== "ADMIN" && role !== "SHIFT_LEAD") redirect("/inventory");

  const suppliers = await db.supplier.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Neuer Artikel</h1>
        <p className="text-muted-foreground">Artikelstamm anlegen</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Artikeldaten</CardTitle>
          <CardDescription>EK = Einkaufspreis, VK = Verkaufspreis</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProduct} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU / Artikelnummer</Label>
                <Input id="sku" name="sku" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Input id="category" name="category" placeholder="z.B. Getränke, Eis, Snacks" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Einheit *</Label>
                <Select id="unit" name="unit" defaultValue="Stück">
                  <option>Stück</option>
                  <option>Packung</option>
                  <option>Karton</option>
                  <option>kg</option>
                  <option>g</option>
                  <option>L</option>
                  <option>ml</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatRate">MwSt. *</Label>
                <Select id="vatRate" name="vatRate" defaultValue="0.19">
                  <option value="0.19">19% (Standard)</option>
                  <option value="0.07">7% (Lebensmittel)</option>
                  <option value="0">0% (keine)</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierId">Lieferant</Label>
                <Select id="supplierId" name="supplierId" defaultValue="">
                  <option value="">— Keiner —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">EK-Preis (€)</Label>
                <Input id="purchasePrice" name="purchasePrice" placeholder="z.B. 0,45" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellPrice">VK-Preis (€)</Label>
                <Input id="sellPrice" name="sellPrice" placeholder="z.B. 1,50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Mindestbestand</Label>
                <Input id="minStock" name="minStock" type="number" step="0.01" defaultValue="0" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input id="trackExpiry" name="trackExpiry" type="checkbox" className="h-4 w-4" />
              <Label htmlFor="trackExpiry">MHD-pflichtig (verderbliche Ware)</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Anlegen</Button>
              <Button asChild variant="outline">
                <a href="/inventory">Abbrechen</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
