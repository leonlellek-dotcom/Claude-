import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const [userCount, productCount, invoiceCount, auditCount] = await Promise.all([
    db.user.count(),
    db.product.count(),
    db.invoice.count(),
    db.auditLog.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground">System-Übersicht & Konfiguration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System-Übersicht</CardTitle>
          <CardDescription>Datenbestand zum Stichtag heute</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Mitarbeiter" value={userCount.toString()} />
            <Stat label="Artikel" value={productCount.toString()} />
            <Stat label="Rechnungen" value={invoiceCount.toString()} />
            <Stat label="Audit-Einträge" value={auditCount.toString()} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rechtliche Aspekte</CardTitle>
          <CardDescription>Was das System abdeckt — und was (noch) nicht</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Badge variant="success">OK</Badge>
            <span>Audit-Log für alle relevanten Datenänderungen (GoBD-Vorbereitung).</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="success">OK</Badge>
            <span>Rechnungen werden mit SHA-256-Hash unveränderbar archiviert.</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="warn">Phase 2</Badge>
            <span>HACCP-Modul (Kühlschrank-Temperaturen, Reinigungsplan).</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="warn">Phase 2</Badge>
            <span>MHD-Tracking mit Chargen.</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline">Bewusst nicht</Badge>
            <span>
              Keine TSE-konforme Kasse (Bargeschäft mit Bonpflicht) — das System ist ein
              <strong> Kassenbuch</strong>, kein Kassensystem. Bei Bedarf kann ein TSE-Modul
              (z.B. fiskaly) nachgerüstet werden.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit-Log (letzte 20)</CardTitle>
          <CardDescription>Wer hat wann was geändert</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <AuditTable />
        </CardContent>
      </Card>
    </div>
  );
}

async function AuditTable() {
  const entries = await db.auditLog.findMany({
    take: 20,
    orderBy: { at: "desc" },
    include: { user: { select: { name: true } } },
  });
  return (
    <table className="w-full text-sm">
      <thead className="border-b bg-muted/50 text-left">
        <tr>
          <th className="px-4 py-2 font-medium">Wann</th>
          <th className="px-4 py-2 font-medium">Mitarbeiter</th>
          <th className="px-4 py-2 font-medium">Aktion</th>
          <th className="px-4 py-2 font-medium">Entität</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.id} className="border-b last:border-0">
            <td className="px-4 py-2 text-muted-foreground">
              {e.at.toLocaleString("de-DE")}
            </td>
            <td className="px-4 py-2">{e.user?.name ?? "—"}</td>
            <td className="px-4 py-2">
              <Badge variant="outline">{e.action}</Badge>
            </td>
            <td className="px-4 py-2 text-muted-foreground">
              {e.entity}/{e.entityId.slice(0, 8)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
