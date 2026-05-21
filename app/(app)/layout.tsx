import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar, MobileNav } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={session.user.name ?? "Mitarbeiter"} userRole={session.user.role} />
      <main className="flex-1 overflow-x-auto pb-20 md:pb-0">
        <div className="container mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</div>
      </main>
      <MobileNav userRole={session.user.role} />
    </div>
  );
}
