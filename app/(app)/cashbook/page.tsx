import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { centsToEuroString } from "@/lib/money";
import { formatDateDE } from "@/lib/utils";
import { CASH_TX_TYPES, CASH_TX_LABELS, type CashTxType } from "@/lib/enums";
import { Plus, Wallet } from "lucide-react";
import { recordCashTransaction } from "./actions";

export default async function CashbookPage() {
  const [counts, transactions, lastClose] = await Promise.all([
    db.cashCount.findMany({
      take: 20,
      orderBy: { countedAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    db.cashTransaction.findMany({
      take: 30,
      orderBy: { occurredAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    db.cashCount.findFirst({ where: { isDailyClose: true }, orderBy: { countedAt: "desc" } }),
  ]);

  const sinceClose = lastClose
    ? await db.cashTransaction.aggregate({
        where: { occurredAt: { gt: lastClose.countedAt } },
        _sum: { amountCt: true },
      })
    : null;

  const expectedNow = lastClose
    ? lastClose.totalCt + (sinceClose?._sum.amountCt ?? 0)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kassenbuch</h1>
          <p className="text-muted-foreground">Bargeldzählung & Kassenbewegungen</p>
        </div>
        <Button asChild>
          <Link href="/cashbook/count">
            <Plus className="h-4 w-4" /> Kasse zählen
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" /> Letzter Tagesabschluss
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {lastClose ? centsToEuroString(lastClose.totalCt) : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              {lastClose ? formatDateDE(lastClose.countedAt, true) : "Noch kein Abschluss"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Bewegungen seit Abschluss</div>
            <div className="mt-2 text-2xl font-semibold">
              {centsToEuroString(sinceClose?._sum.amountCt ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Erwarteter Kassenbestand</div>
            <div className="mt-2 text-2xl font-semibold">
              {expectedNow != null ? centsToEuroString(expectedNow) : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kassenbewegung erfassen</CardTitle>
          <CardDescription>Einlagen, Entnahmen, Wechselgeld</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={recordCashTransaction} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="type">Typ *</Label>
              <Select id="type" name="type" defaultValue="WITHDRAWAL">
                {CASH_TX_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {CASH_TX_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Betrag (€) *</Label>
              <Input id="amount" name="amount" placeholder="0,00" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reason">Grund *</Label>
              <Input id="reason" name="reason" placeholder="z.B. Einkauf Getränke, Wechselgeld holen" required />
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <div className="md:col-span-4">
              <Button type="submit">Buchen</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Letzte Kassenzählungen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Wann</th>
                <th className="px-4 py-2 font-medium">Mitarbeiter</th>
                <th className="px-4 py-2 font-medium">Ist</th>
                <th className="px-4 py-2 font-medium">Soll</th>
                <th className="px-4 py-2 font-medium">Differenz</th>
                <th className="px-4 py-2 font-medium">Typ</th>
              </tr>
            </thead>
            <tbody>
              {counts.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-2 text-muted-foreground">{formatDateDE(c.countedAt, true)}</td>
                  <td className="px-4 py-2">{c.user.name}</td>
                  <td className="px-4 py-2 font-medium">{centsToEuroString(c.totalCt)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{centsToEuroString(c.expectedCt)}</td>
                  <td className="px-4 py-2">
                    {c.diffCt == null ? (
                      "—"
                    ) : c.diffCt === 0 ? (
                      <Badge variant="success">Stimmt</Badge>
                    ) : (
                      <Badge variant={Math.abs(c.diffCt) > 500 ? "destructive" : "warn"}>
                        {centsToEuroString(c.diffCt)}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {c.isDailyClose ? <Badge>Tagesabschluss</Badge> : <Badge variant="outline">Zwischen</Badge>}
                  </td>
                </tr>
              ))}
              {counts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Noch keine Zählungen.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Letzte Kassenbewegungen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Wann</th>
                <th className="px-4 py-2 font-medium">Typ</th>
                <th className="px-4 py-2 font-medium">Betrag</th>
                <th className="px-4 py-2 font-medium">Grund</th>
                <th className="px-4 py-2 font-medium">Mitarbeiter</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="px-4 py-2 text-muted-foreground">{formatDateDE(t.occurredAt, true)}</td>
                  <td className="px-4 py-2">{CASH_TX_LABELS[t.type as CashTxType]}</td>
                  <td className={"px-4 py-2 font-medium " + (t.amountCt < 0 ? "text-destructive" : "text-success")}>
                    {centsToEuroString(t.amountCt)}
                  </td>
                  <td className="px-4 py-2">{t.reason}</td>
                  <td className="px-4 py-2 text-muted-foreground">{t.user.name}</td>
                </tr>
              ))}
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Noch keine Bewegungen.
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
