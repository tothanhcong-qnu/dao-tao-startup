import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardUI } from "./components/DashboardUI";

export default async function DashboardPage() {
  // Uncomment and use auth when needed:
  // const supabase = createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) redirect("/login");

  return <DashboardUI />;
}
