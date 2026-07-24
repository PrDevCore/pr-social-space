import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import SocialSpaceDashboard from "@/components/socialspace/SocialSpaceDashboard";

export default async function DashboardPage() {
  const session = await auth0.getSession();
  if (!session?.user?.sub) redirect("/auth/login");

  return <SocialSpaceDashboard />;
}
