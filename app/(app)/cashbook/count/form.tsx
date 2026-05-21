"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALL_DENOMINATIONS, calculateCashTotal, centsToEuroString, COIN_DENOMINATIONS, NOTE_DENOMINATIONS, type DenominationKey } from "@/lib/money";

export function CashCountForm({ expectedDefault }: { expectedDefault: string }) {
  const [counts, setCounts] = useState<Record<DenominationKey, number>>(
    Object.fromEntries(ALL_DENOMINATIONS.map((d) => [d.key, 0])) as Record<DenominationKey, number>,
  );
  const [expected, setExpected] = useState(expectedDefault);

  const total = calculateCashTotal(counts);
  const expectedCt = parseExpected(expected);
  const diff = expectedCt != null ? total - expectedCt : null;

  function setCount(key: DenominationKey, value: string) {
    const n = Number(value);
    setCounts((prev) => ({ ...prev, [key]: Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0 }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Münzen</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          {COIN_DENOMINATIONS.map((d) => (
            <div key={d.key}>
              <Label htmlFor={d.key} className="text-xs">
                {d.labelEuro}
              </Label>
              <Input
                id={d.key}
                name={d.key}
                type="number"
                min="0"
                step="1"
                value={counts[d.key]}
                onChange={(e) => setCount(d.key, e.target.value)}
                className="text-right"
              />
              <div className="mt-1 text-xs text-muted-foreground">
                = {centsToEuroString(counts[d.key] * d.valueCt)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Scheine</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          {NOTE_DENOMINATIONS.map((d) => (
            <div key={d.key}>
              <Label htmlFor={d.key} className="text-xs">
                {d.labelEuro}
              </Label>
              <Input
                id={d.key}
                name={d.key}
                type="number"
                min="0"
                step="1"
                value={counts[d.key]}
                onChange={(e) => setCount(d.key, e.target.value)}
                className="text-right"
              />
              <div className="mt-1 text-xs text-muted-foreground">
                = {centsToEuroString(counts[d.key] * d.valueCt)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border-2 border-primary bg-accent/30 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Gezählter Bestand</div>
          <div className="text-2xl font-bold">{centsToEuroString(total)}</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expected">Soll-Bestand (€)</Label>
          <Input
            id="expected"
            name="expected"
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            placeholder="optional"
          />
        </div>
        <div className="space-y-2">
          <Label>Differenz</Label>
          <div
            className={
              "rounded-md border p-2 font-semibold " +
              (diff == null ? "text-muted-foreground" : diff === 0 ? "border-success text-success" : Math.abs(diff) > 500 ? "border-destructive text-destructive" : "border-warn text-warn")
            }
          >
            {diff == null ? "—" : centsToEuroString(diff)}
          </div>
        </div>
      </div>
    </div>
  );
}

function parseExpected(input: string): number | null {
  if (!input) return null;
  const n = Number(input.replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
