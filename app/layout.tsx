import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Freibad-Kiosk Warenwirtschaft",
  description: "Verwaltung für Freibad-Kiosk: Schichten, Lager, Kasse, Checklisten",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0891b2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
