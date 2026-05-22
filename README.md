# Freibad-Kiosk Warenwirtschaftssystem

Komplette Verwaltungssoftware für einen Freibad-Kiosk: Schichten, Aufgaben, Checklisten, Lager, Rechnungen, Kassenbuch.

## 🚀 Vom Handy online stellen

➡ **Komplette Anleitung: [MOBILE-DEPLOY.md](./MOBILE-DEPLOY.md)** (5 Minuten, kostenlos, nur vom Handy aus)

Du klickst dich durch Vercel.com, Datenbank wird automatisch erstellt, beim ersten Aufruf legst du dein Admin-Konto an — fertig.

## Schnellstart (lokal, Entwicklung)

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Datenbank initialisieren
npx prisma db push

# 3. Beispieldaten einspielen
npm run seed

# 4. Dev-Server starten
npm run dev
```

Dann öffne http://localhost:3000

**Login (aus Seed):**
- Admin: `admin@freibad.de` / `admin1234`
- Mitarbeiter: `anna@freibad.de` / `mitarbeiter1234`
- Aushilfe: `tim@freibad.de` / `mitarbeiter1234`

## Module (Phase 1 — MVP)

- **Dashboard**: Übersicht, Schnellzugriff
- **Schichten**: Wochenkalender, Self-Service-Eintragung
- **Aufgaben**: Verteilung, Status, Wiederholung
- **Checklisten**: Vorlagen erstellen, abhaken
- **Lager**: Artikel, Bestand, Wareneingang, Lieferanten
- **Rechnungen**: Upload (PDF/Foto), Positionen, Wareneingang
- **Kassenbuch**: Zählung nach Stückelung, Tagesabschluss, Differenzen
- **Mitteilungen**: Schichtübergabe-Notizen
- **Admin**: Mitarbeiter, Audit-Log, System-Übersicht

## Technologie

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + Radix UI
- Prisma ORM + SQLite (dev) / PostgreSQL (prod)
- Auth.js (NextAuth v5) Credentials
- Zod-Validierung, React Hook Form
- Lucide Icons

## Phasen

- ✅ **Phase 1 (MVP)** — siehe oben
- 🔜 **Phase 2** — HACCP (Temperaturen), MHD-Tracking, Pfand, GoBD-Export
- 🔜 **Phase 3** — Wetter-Integration (DWD), Wartung, Vorfälle, Berichte, Offline-PWA

## Deployment in Produktion

1. PostgreSQL-Datenbank einrichten (z.B. Hetzner Cloud)
2. In `prisma/schema.prisma` `provider = "postgresql"` setzen
3. `DATABASE_URL` in `.env` anpassen
4. `AUTH_SECRET` generieren: `openssl rand -base64 32`
5. Auf Vercel deployen oder `npm run build && npm start`
6. Datei-Uploads: Für Produktion auf S3-kompatibel umstellen (Hetzner Object Storage)

## Rechtliches

- **DSGVO**: EU-Hosting, AV-Verträge mit allen Drittanbietern.
- **GoBD**: Rechnungen werden mit SHA-256-Hash unveränderbar archiviert. Audit-Log loggt alle Schreibvorgänge.
- **HACCP**: kommt in Phase 2.
- **TSE**: Nicht enthalten — das System ist als **Kassenbuch** konzipiert, nicht als Registrierkasse.
- **ArbZG / Mindestlohn**: Stundennachweise via Schichten + Stundenlohn (Export folgt).

## Lizenz

Privat / Eigentum des Betreibers.
