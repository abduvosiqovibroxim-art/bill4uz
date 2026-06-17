import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardIndexPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("billard_role")?.value;

  if (role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  if (role === "ORGANIZER") {
    redirect("/dashboard/organizer");
  }

  if (role === "CLUB") {
    redirect("/booking");
  }

  redirect("/dashboard/player");
}
