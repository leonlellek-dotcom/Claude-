import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveCashCount } from "../actions";
import { CashCountForm } from "./form";

export default async function CashCountPage() {
  const lastClose = await db.cashCount.findFirst({
    where: { isDailyClose: true },
    orderBy: { countedAt: "desc" },
  });
  const sinceClose = lastClose
    ? await db.cashTransaction.aggregate({
        where: { occurredAt: { gt: lastClose.countedAt } },
        _sum: { amountCt: true },
      })
    : null;

  const expectedNow = lastClose ? lastClose.totalCt + (sinceClose?._sum.amountCt ?? 0) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kasse zählen</h1>
        <p className="text-muted-foreground">Stückzahlen eintragen, Summe wird automatisch berechnet</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zählung</CardTitle>
          <CardDescription>
            {expectedNow != null
              ? `Erwarteter Bestand laut letztem Tagesabschluss + Bewegungen: ${(expectedNow / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`
              : "Noch kein Tagesabschluss vorhanden — bitte trotzdem zählen."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveCashCount} className="space-y-6">
            <CashCountForm expectedDefault={expectedNow != null ? (expectedNow / 100).toFixed(2).replace(".", ",") : ""} />
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea id="notes" name="notes" rows={2} placeholder="z.B. Schichtwechsel, ungewöhnliche Differenz" />
            </div>
            <div className="flex items-center gap-2">
              <input id="isDailyClose" name="isDailyClose" type="checkbox" className="h-4 w-4" />
              <Label htmlFor="isDailyClose">Als Tagesabschluss markieren</Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="lg">
                Zählung speichern
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/cashbook">Abbrechen</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
