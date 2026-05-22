import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAnyAdmin } from "@/lib/setup";

export default async function RootPage() {
  if (!(await hasAnyAdmin())) {
    redirect("/setup");
  }
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  redirect("/login");
}
