import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { UserRole } from "@/lib/enums";
import { createSupplier } from "../actions";

export default async function SuppliersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role as UserRole;
  const suppliers = await db.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true, invoices: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lieferanten</h1>
        <p className="text-muted-foreground">Lieferanten-Verwaltung</p>
      </div>

      {role === "ADMIN" || role === "SHIFT_LEAD" ? (
        <Card>
          <CardHeader>
            <CardTitle>Neuen Lieferanten anlegen</CardTitle>
            <CardDescription>Wird auch für Rechnungen benötigt</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createSupplier} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Ansprechpartner</Label>
                <Input id="contactName" name="contactName" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" name="address" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerNumber">Kundennummer</Label>
                <Input id="customerNumber" name="customerNumber" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea id="notes" name="notes" rows={2} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Lieferant anlegen</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Alle Lieferanten ({suppliers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Kontakt</th>
                <th className="px-4 py-2 font-medium">E-Mail</th>
                <th className="px-4 py-2 font-medium">Telefon</th>
                <th className="px-4 py-2 font-medium">Artikel</th>
                <th className="px-4 py-2 font-medium">Rechnungen</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">{s.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{s.contactName ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{s.email ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{s.phone ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{s._count.products}</td>
                  <td className="px-4 py-2 text-muted-foreground">{s._count.invoices}</td>
                </tr>
              ))}
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Noch keine Lieferanten.
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
