import type { SupabaseClient } from "@supabase/supabase-js";

export type Person = { id: string; name: string; avatar: string | null; handle: string | null };
export type Link = { source: string; target: string };
export type EventGraph = { nodes: Person[]; links: Link[] };

export async function getEventGraph(supabase: SupabaseClient): Promise<EventGraph> {
  const { data, error } = await supabase.rpc("event_graph");
  if (error) throw error;
  return data as EventGraph;
}

export function adjacency(links: Link[]) {
  const adj = new Map<string, string[]>();
  const add = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push(b);
  };
  for (const { source, target } of links) {
    add(source, target);
    add(target, source);
  }
  return adj;
}

/** Breadth-first search from `me`: distance and the previous hop on a shortest path. */
export function reach(links: Link[], me: string) {
  const adj = adjacency(links);
  const dist = new Map<string, number>([[me, 0]]);
  const parent = new Map<string, string>();
  const queue = [me];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const next of adj.get(cur) ?? []) {
      if (dist.has(next)) continue;
      dist.set(next, dist.get(cur)! + 1);
      parent.set(next, cur);
      queue.push(next);
    }
  }
  return { dist, parent };
}

/** [me, ..., id] or null if unreachable. */
export function pathTo(parent: Map<string, string>, me: string, id: string): string[] | null {
  if (id === me) return [me];
  if (!parent.has(id)) return null;
  const path = [id];
  let cur = id;
  while (cur !== me) {
    cur = parent.get(cur)!;
    path.unshift(cur);
  }
  return path;
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?"
  );
}
