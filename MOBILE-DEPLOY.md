# Vom Handy online stellen — Schritt für Schritt

Du brauchst nur dein Handy. Das alles kostet **0 €** (Vercel Hobby-Plan + Neon Postgres Free).

## Das ist deine Aufgabe (ca. 5 Minuten)

### 1. Vercel-Account erstellen

1. Öffne im Handy-Browser: **https://vercel.com/signup**
2. Tippe auf **"Continue with GitHub"** (du loggst dich mit deinem GitHub-Konto ein, das du schon hast)
3. Falls GitHub fragt: **"Authorize Vercel"** antippen
4. Bei Vercel: einen Namen für dich wählen (Plan: **Hobby** = kostenlos)

### 2. Projekt importieren

1. Auf der Vercel-Startseite tippst du **"Add New..."** → **"Project"**
2. Du siehst eine Liste deiner GitHub-Repos. Such **"Claude-"** und tippe **"Import"**
3. Bei "Configure Project":
   - **Framework Preset**: ist schon "Next.js" — passt
   - **Root Directory**: lass leer
   - **Build Command**, **Install Command**, **Output Directory**: alles unverändert lassen
   - **Branch**: wähle `claude/freibad-kiosk-inventory-MpQZ0` (das ist der fertige Branch)

### 3. Datenbank hinzufügen (wichtig!)

Auf derselben Seite siehst du **"Storage"** oder **"Add Database"**:

1. Tippe auf **"Create Postgres Database"** oder **"Add"** → **"Postgres"**
2. Wähle **"Neon Postgres"** (kostenlos)
3. Name: `freibad-db` (oder beliebig)
4. Region: **Frankfurt** (am nächsten zu DE)
5. Tippe **"Create"** → **"Connect Project"**

Vercel verbindet die DB automatisch mit deinem Projekt. Du musst nichts kopieren.

### 4. Deploy starten

1. Tippe ganz unten auf den großen **"Deploy"** Knopf
2. Warte **2-3 Minuten** (siehst Logs durchlaufen — das ist normal)
3. Wenn fertig: Knopf **"Continue to Dashboard"** oder ein **Konfetti-Bildschirm** mit "Congratulations"

### 5. Deine Adresse merken

Auf dem Dashboard siehst du die URL — sie sieht so aus:
`https://claude-deinname.vercel.app`

Diese URL kannst du:
- Im Handy-Browser öffnen
- An deine Mitarbeiter per WhatsApp schicken
- Als Lesezeichen speichern
- Zum Startbildschirm hinzufügen (Safari/Chrome: "Zum Startbildschirm")

### 6. Erstmaliges Einloggen

1. Öffne deine Vercel-URL im Handy-Browser
2. Es erscheint der **Setup-Wizard** (nur beim allerersten Aufruf)
3. Trag ein:
   - **Dein Name** (z.B. "Leon Lellek")
   - **Deine E-Mail** (mit der willst du dich einloggen)
   - **Passwort** (min. 8 Zeichen — gut merken!)
   - Häkchen bei **"Mit Beispieldaten starten"** lassen → spart dir Arbeit
4. Tippe **"System einrichten"** — du bist sofort eingeloggt!

### 7. Fertig!

Du bist im Dashboard. Alles läuft. Probier alle Module aus.

---

## Was wenn etwas nicht klappt?

**Build schlägt fehl?** Im Vercel-Dashboard kannst du auf den fehlgeschlagenen Deploy tippen und siehst die Fehlermeldung. Schick mir den Text, ich fix es.

**Setup-Seite kommt nicht?** Lade die Seite mit der URL `/setup` direkt auf (z.B. `https://claude-deinname.vercel.app/setup`)

**Login klappt nicht?** Die E-Mail/Passwort, die du im Setup eingegeben hast.

## Mitarbeiter dazu holen

Wenn du als Admin eingeloggt bist:
1. **Mitarbeiter** in der Navi
2. **"Mitarbeiter anlegen"**
3. Trag Name, E-Mail, Passwort ein
4. Schick deinem Mitarbeiter die URL + die Zugangsdaten per WhatsApp
5. Er öffnet die URL → loggt sich ein → sieht nur die Bereiche, die du ihm erlaubst

## Daten bleiben dauerhaft

Anders als bei der Test-Sitzung in Claude: Hier sind alle Daten in deiner Postgres-Datenbank gespeichert und bleiben für immer (so lange dein Vercel- und Neon-Account aktiv sind).

## Mehr Sicherheit (optional, kann später)

Im Vercel-Dashboard → dein Projekt → **Settings** → **Environment Variables** → **"Add"**:
- Name: `AUTH_SECRET`
- Value: irgendeine zufällige Zeichenkette (min. 32 Zeichen, einfach Tastatur rollen)
- Save → dann unter **Deployments** → drei Punkte → **Redeploy**
