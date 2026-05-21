// Alle Geldwerte werden als Integer in Cent gespeichert (keine Floats!).
// Diese Helper konvertieren zwischen Cent und String-Darstellung.

export function centsToEuroString(cents: number | null | undefined): string {
  if (cents == null) return "—";
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  const formatted = `${whole.toLocaleString("de-DE")},${frac.toString().padStart(2, "0")} €`;
  return negative ? `−${formatted}` : formatted;
}

export function parseEuroToCents(input: string): number | null {
  if (!input) return null;
  const normalized = input
    .replace(/€/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "") // tausender
    .replace(",", ".");
  const num = Number(normalized);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100);
}

export const COIN_DENOMINATIONS = [
  { key: "c01", labelEuro: "0,01 €", valueCt: 1 },
  { key: "c02", labelEuro: "0,02 €", valueCt: 2 },
  { key: "c05", labelEuro: "0,05 €", valueCt: 5 },
  { key: "c10", labelEuro: "0,10 €", valueCt: 10 },
  { key: "c20", labelEuro: "0,20 €", valueCt: 20 },
  { key: "c50", labelEuro: "0,50 €", valueCt: 50 },
  { key: "e1", labelEuro: "1 €", valueCt: 100 },
  { key: "e2", labelEuro: "2 €", valueCt: 200 },
] as const;

export const NOTE_DENOMINATIONS = [
  { key: "b5", labelEuro: "5 €", valueCt: 500 },
  { key: "b10", labelEuro: "10 €", valueCt: 1000 },
  { key: "b20", labelEuro: "20 €", valueCt: 2000 },
  { key: "b50", labelEuro: "50 €", valueCt: 5000 },
  { key: "b100", labelEuro: "100 €", valueCt: 10000 },
  { key: "b200", labelEuro: "200 €", valueCt: 20000 },
  { key: "b500", labelEuro: "500 €", valueCt: 50000 },
] as const;

export const ALL_DENOMINATIONS = [...COIN_DENOMINATIONS, ...NOTE_DENOMINATIONS];

export type DenominationKey = (typeof ALL_DENOMINATIONS)[number]["key"];

export function calculateCashTotal(counts: Partial<Record<DenominationKey, number>>): number {
  let total = 0;
  for (const denom of ALL_DENOMINATIONS) {
    const n = counts[denom.key] ?? 0;
    total += n * denom.valueCt;
  }
  return total;
}
