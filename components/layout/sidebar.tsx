"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ListChecks,
  ClipboardCheck,
  Package,
  Receipt,
  Wallet,
  Users,
  MessagesSquare,
  Settings,
  LogOut,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/enums";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[]; // wenn leer: alle
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/shifts", label: "Schichten", icon: CalendarDays },
  { href: "/tasks", label: "Aufgaben", icon: ListChecks },
  { href: "/checklists", label: "Checklisten", icon: ClipboardCheck },
  { href: "/inventory", label: "Lager", icon: Package },
  { href: "/purchases", label: "Rechnungen", icon: Receipt },
  { href: "/cashbook", label: "Kasse", icon: Wallet },
  { href: "/messages", label: "Mitteilungen", icon: MessagesSquare },
  { href: "/admin/users", label: "Mitarbeiter", icon: Users, roles: ["ADMIN", "SHIFT_LEAD"] },
  { href: "/admin/settings", label: "Einstellungen", icon: Settings, roles: ["ADMIN"] },
];

export function Sidebar({
  userName,
  userRole,
}: {
  userName: string;
  userRole: UserRole;
}) {
  const pathname = usePathname();
  const items = navItems.filter((i) => !i.roles || i.roles.includes(userRole));

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Waves className="h-6 w-6 text-primary" />
        <div>
          <div className="text-sm font-semibold leading-tight">Freibad-Kiosk</div>
          <div className="text-xs text-muted-foreground">Warenwirtschaft</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="mb-2 px-2 text-xs">
          <div className="font-medium">{userName}</div>
          <div className="text-muted-foreground">{userRole}</div>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileNav({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname();
  const items = navItems
    .filter((i) => !i.roles || i.roles.includes(userRole))
    .slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-card md:hidden">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
