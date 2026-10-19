import { redirect } from "next/navigation";
import { LiveRefresher } from "@/components/LiveRefresher";
import { NavBar } from "@/components/NavBar";
import { adjacency, getEventGraph, reach, type Person } from "@/lib/graph";
import { createClient } from "@/lib/supabase/server";
import { PeopleList, type Direct, type ViaGroup } from "./PeopleList";

export default async function People({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [graph, { data: rows }] = await Promise.all([
    getEventGraph(supabase),
    supabase.from("connections").select("user_a, user_b, note_a, note_b, created_at").order("created_at", { ascending: false }),
  ]);

  const byId = new Map<string, Person>(graph.nodes.map((n) => [n.id, n]));
  const direct: Direct[] = (rows ?? []).flatMap((r) => {
    const iAmA = r.user_a === user.id;
    const person = byId.get(iAmA ? r.user_b : r.user_a);
    if (!person) return [];
    return [{ person, myNote: iAmA ? r.note_a : r.note_b, theirNote: iAmA ? r.note_b : r.note_a, at: r.created_at }];
  });

  const { dist } = reach(graph.links, user.id);
  const adj = adjacency(graph.links);
  const via: ViaGroup[] = direct
    .map(({ person }) => ({
      via: person,
      people: (adj.get(person.id) ?? []).filter((id) => dist.get(id) === 2).map((id) => byId.get(id)!).filter(Boolean),
    }))
    .filter((g) => g.people.length > 0);

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-28 pt-6">
      <LiveRefresher />
      <h1 className="text-2xl font-semibold">People</h1>
      <PeopleList direct={direct} via={via} initialTab={(await searchParams).tab === "via" ? "via" : "direct"} />
      <NavBar />
    </main>
  );
}
