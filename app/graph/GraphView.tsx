"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods, type LinkObject, type NodeObject } from "react-force-graph-2d";
import { Avatar } from "@/components/Avatar";
import { ViewLinkedIn } from "@/components/ViewLinkedIn";
import { initials, pathTo, reach, type EventGraph, type Person } from "@/lib/graph";
import { createClient } from "@/lib/supabase/client";

type GNode = NodeObject<Person>;
type GLink = LinkObject<Person>;

const COLORS = { me: "#4285f4", direct: "#34a853", second: "#fbbc04", other: "#bdc1c6" };
const REFRESH_MS = 30_000;

export function GraphView({ me, initial }: { me: string; initial: EventGraph }) {
  const fg = useRef<ForceGraphMethods<GNode, GLink> | undefined>(undefined);
  const [data, setData] = useState(initial);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // Reuse node objects across refreshes so positions don't reset.
  const nodeCache = useRef(new Map<string, GNode>());
  const graphData = useMemo(() => {
    const nodes = data.nodes.map((p) => {
      const n = nodeCache.current.get(p.id) ?? ({} as GNode);
      Object.assign(n, p);
      nodeCache.current.set(p.id, n);
      return n;
    });
    return { nodes, links: data.links.map((l) => ({ ...l })) };
  }, [data]);

  const { dist, parent } = useMemo(() => reach(data.links, me), [data.links, me]);
  const byId = useMemo(() => new Map(data.nodes.map((n) => [n.id, n])), [data.nodes]);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const timer = setInterval(async () => {
      if (document.hidden) return;
      const { data: fresh } = await supabase.rpc("event_graph");
      if (fresh) setData(fresh as EventGraph);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  // Avatar images, loaded lazily. When one arrives, nudge the canvas to redraw.
  const images = useRef(new Map<string, HTMLImageElement | null>());
  const redrawTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  function avatarFor(n: GNode) {
    if (!n.avatar) return null;
    const cached = images.current.get(n.id);
    if (cached !== undefined) return cached?.complete && cached.naturalWidth ? cached : null;
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.onload = () => {
      clearTimeout(redrawTimer.current);
      redrawTimer.current = setTimeout(() => fg.current && fg.current.zoom(fg.current.zoom() * 1.000001), 150);
    };
    img.onerror = () => images.current.set(n.id, null);
    img.src = n.avatar;
    images.current.set(n.id, img);
    return null;
  }

  function colorOf(id: string) {
    const d = dist.get(id);
    return d === 0 ? COLORS.me : d === 1 ? COLORS.direct : d === 2 ? COLORS.second : COLORS.other;
  }

  function focus(id: string) {
    const n = nodeCache.current.get(id);
    setSelected(id);
    if (n?.x != null && n.y != null) {
      fg.current?.centerAt(n.x, n.y, 600);
      fg.current?.zoom(4, 600);
    }
  }

  const matches = q.trim()
    ? data.nodes.filter((n) => n.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6)
    : [];

  const sel = selected ? byId.get(selected) : null;
  const path = selected ? pathTo(parent, me, selected) : null;
  const selNeighbors = useMemo(() => {
    if (!selected) return new Set<string>();
    const s = new Set<string>();
    for (const l of data.links) {
      if (l.source === selected) s.add(l.target);
      if (l.target === selected) s.add(l.source);
    }
    return s;
  }, [selected, data.links]);

  const idOf = (end: string | number | GNode | undefined) => (typeof end === "object" ? (end.id as string) : String(end));

  return (
    <div className="relative h-full bg-[#f8f9fa]">
      {size.w > 0 && (
        <ForceGraph2D<Person>
          ref={fg}
          width={size.w}
          height={size.h}
          graphData={graphData}
          backgroundColor="#f8f9fa"
          cooldownTicks={200}
          warmupTicks={30}
          linkColor={(l) => {
            const a = idOf(l.source), b = idOf(l.target);
            if (selected && (a === selected || b === selected)) return "rgba(66,133,244,0.8)";
            return a === me || b === me ? "rgba(52,168,83,0.55)" : "rgba(95,99,104,0.18)";
          }}
          linkWidth={(l) => (selected && (idOf(l.source) === selected || idOf(l.target) === selected) ? 2 : 1)}
          onNodeClick={(n) => focus(n.id as string)}
          onBackgroundClick={() => setSelected(null)}
          nodeCanvasObject={(n, ctx, scale) => {
            const id = n.id as string;
            const d = dist.get(id);
            const r = d === 0 ? 9 : d === 1 ? 7 : d === 2 ? 6 : 5;
            const x = n.x ?? 0, y = n.y ?? 0;
            const dim = selected && id !== selected && !selNeighbors.has(id);
            ctx.globalAlpha = dim ? 0.25 : 1;

            // coloured ring
            ctx.beginPath();
            ctx.arc(x, y, r + 1.5, 0, 2 * Math.PI);
            ctx.fillStyle = colorOf(id);
            ctx.fill();

            const img = avatarFor(n);
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.clip();
            if (img) {
              ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
            } else {
              ctx.fillStyle = "#fff";
              ctx.fill();
              ctx.fillStyle = "#5f6368";
              ctx.font = `600 ${r * 0.8}px system-ui, sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(initials(n.name), x, y + 0.5);
            }
            ctx.restore();

            if (scale > 2.2 || d === 0 || id === selected) {
              const fs = 11 / scale;
              ctx.font = `500 ${fs}px system-ui, sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillStyle = "#202124";
              ctx.fillText(d === 0 ? "You" : n.name, x, y + r + 3);
            }
            ctx.globalAlpha = 1;
          }}
          nodePointerAreaPaint={(n, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(n.x ?? 0, n.y ?? 0, 10, 0, 2 * Math.PI);
            ctx.fill();
          }}
        />
      )}

      {/* top bar: search + legend */}
      <div className="pointer-events-none absolute inset-x-0 top-0 p-4">
        <div className="pointer-events-auto mx-auto max-w-md">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${data.nodes.length} people at DevFest`}
            className="w-full rounded-full border border-line bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-g-blue"
          />
          {matches.length > 0 && (
            <ul className="mt-1 overflow-hidden rounded-2xl bg-white shadow-lg">
              {matches.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => {
                      focus(m.id);
                      setQ("");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-line/50"
                  >
                    <Avatar name={m.name} src={m.avatar} size={28} />
                    {m.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
            <Legend color={COLORS.me} label="You" />
            <Legend color={COLORS.direct} label="Met directly" />
            <Legend color={COLORS.second} label="Through them" />
            <Legend color={COLORS.other} label="Others" />
          </div>
        </div>
      </div>

      {/* bottom sheet for the selected person */}
      {sel && (
        <div className="absolute inset-x-0 bottom-[68px] z-20 px-3 pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto max-w-md rounded-3xl bg-white p-4 shadow-[0_-2px_24px_rgba(60,64,67,0.18)]">
            <div className="flex items-center gap-3">
              <Avatar name={sel.name} src={sel.avatar} size={52} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{sel.id === me ? `${sel.name} (you)` : sel.name}</div>
                <div className="text-xs text-muted">
                  {selNeighbors.size} connection{selNeighbors.size === 1 ? "" : "s"}
                </div>
              </div>
              <ViewLinkedIn handle={sel.handle} name={sel.name} compact />
            </div>
            {sel.id !== me && (
              <p className="mt-3 text-sm">
                {path ? (
                  <>
                    <span className="text-muted">Path: </span>
                    {path.map((id, i) => (
                      <span key={id}>
                        {i > 0 && <span className="text-muted"> → </span>}
                        <button onClick={() => focus(id)} className="font-medium text-g-blue">
                          {id === me ? "You" : byId.get(id)?.name.split(" ")[0]}
                        </button>
                      </span>
                    ))}
                  </>
                ) : (
                  <span className="text-muted">Not connected to your network yet. Go say hi!</span>
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-2 py-0.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
