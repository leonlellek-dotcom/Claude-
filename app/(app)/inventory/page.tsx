import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { centsToEuroString } from "@/lib/money";
import { getAllProductsWithBalance } from "@/server/services/inventory";
import type { UserRole } from "@/lib/enums";
import { Plus, ArrowDownUp, Users, AlertCircle } from "lucide-react";

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role as UserRole;
  const products = await getAllProductsWithBalance();

  const lowStock = products.filter((p) => p.lowStock && p.active);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Lager</h1>
          <p className="text-muted-foreground">Artikel & Bestand</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/inventory/movement">
              <ArrowDownUp className="h-4 w-4" /> Buchung
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/inventory/suppliers">
              <Users className="h-4 w-4" /> Lieferanten
            </Link>
          </Button>
          {role === "ADMIN" || role === "SHIFT_LEAD" ? (
            <Button asChild>
              <Link href="/inventory/products/new">
                <Plus className="h-4 w-4" /> Neuer Artikel
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {lowStock.length > 0 ? (
        <Card className="border-warn">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-warn" />
              {lowStock.length} Artikel mit Niedrigbestand
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {lowStock.map((p) => (
                <Badge key={p.id} variant="warn">
                  {p.name}: {p.balance} {p.unit}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Alle Artikel ({products.length})</CardTitle>
          <CardDescription>Bestand wird aus allen Buchungen berechnet</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Artikel</th>
                <th className="px-4 py-2 font-medium">Kategorie</th>
                <th className="px-4 py-2 font-medium">Bestand</th>
                <th className="px-4 py-2 font-medium">Min</th>
                <th className="px-4 py-2 font-medium">EK</th>
                <th className="px-4 py-2 font-medium">VK</th>
                <th className="px-4 py-2 font-medium">Lieferant</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={"border-b last:border-0 " + (p.lowStock ? "bg-warn/5" : "")}>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      {!p.active ? <Badge variant="secondary">Inaktiv</Badge> : null}
                    </div>
                    {p.sku ? <div className="text-xs text-muted-foreground">{p.sku}</div> : null}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{p.category ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span className={p.lowStock ? "font-semibold text-warn" : ""}>
                      {p.balance} {p.unit}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{p.minStock}</td>
                  <td className="px-4 py-2 text-muted-foreground">{centsToEuroString(p.purchasePriceCt)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{centsToEuroString(p.sellPriceCt)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{p.supplier?.name ?? "—"}</td>
                </tr>
              ))}
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Noch keine Artikel angelegt.
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
