import { db } from "@/lib/db";

// Prüft, ob mindestens ein Admin-User existiert.
// Wenn nicht, zeigt die App den Setup-Wizard an.
export async function hasAnyAdmin(): Promise<boolean> {
  try {
    const count = await db.user.count({ where: { role: "ADMIN" } });
    return count > 0;
  } catch {
    // Datenbank evtl. noch nicht initialisiert
    return false;
  }
}
