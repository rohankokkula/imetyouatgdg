import { redirect } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { getEventGraph } from "@/lib/graph";
import { createClient } from "@/lib/supabase/server";
import { GraphClient } from "./GraphClient";

export default async function GraphPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const graph = await getEventGraph(supabase);

  return (
    <main className="h-dvh overflow-hidden">
      <GraphClient me={user.id} initial={graph} />
      <NavBar />
    </main>
  );
}
