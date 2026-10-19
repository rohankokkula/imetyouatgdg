"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { ViewLinkedIn } from "@/components/ViewLinkedIn";
import type { Person } from "@/lib/graph";

export type Direct = { person: Person; myNote: string | null; theirNote: string | null; at: string };
export type ViaGroup = { via: Person; people: Person[] };

export function PeopleList({ direct, via, initialTab }: { direct: Direct[]; via: ViaGroup[]; initialTab: "direct" | "via" }) {
  const [tab, setTab] = useState(initialTab);
  const [q, setQ] = useState("");
  const match = (p: Person) => p.name.toLowerCase().includes(q.trim().toLowerCase());

  const directShown = direct.filter((d) => match(d.person) || d.myNote?.toLowerCase().includes(q.toLowerCase()));
  const viaShown = via
    .map((g) => ({ ...g, people: match(g.via) ? g.people : g.people.filter(match) }))
    .filter((g) => g.people.length > 0);
  const viaCount = new Set(via.flatMap((g) => g.people.map((p) => p.id))).size;

  return (
    <>
      <div className="mt-4 flex rounded-full bg-line p-1 text-sm font-medium">
        {(["direct", "via"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 transition ${tab === t ? "bg-white text-ink shadow-sm" : "text-muted"}`}
          >
            {t === "direct" ? `Met directly · ${direct.length}` : `Through them · ${viaCount}`}
          </button>
        ))}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search names or notes"
        className="mt-3 w-full rounded-full border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-g-blue"
      />

      {tab === "direct" ? (
        <ul className="mt-4 space-y-3">
          {directShown.length === 0 && <Empty text={direct.length ? "No matches." : "No one yet. Show your QR to the next person you meet!"} />}
          {directShown.map(({ person, myNote, theirNote }) => (
            <li key={person.id} className="rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(60,64,67,0.1)]">
              <div className="flex items-center gap-3">
                <Avatar name={person.name} src={person.avatar} size={44} />
                <div className="min-w-0 flex-1 truncate font-medium">{person.name}</div>
                <ViewLinkedIn handle={person.handle} name={person.name} compact />
              </div>
              {(myNote || theirNote) && (
                <div className="mt-3 space-y-1.5 text-sm">
                  {myNote && (
                    <p>
                      <span className="text-muted">Your note: </span>
                      {myNote}
                    </p>
                  )}
                  {theirNote && (
                    <p>
                      <span className="text-muted">{person.name.split(" ")[0]}&apos;s note: </span>
                      {theirNote}
                    </p>
                  )}
                </div>
              )}
              <Link href={`/c/${person.id}`} className="mt-2 inline-block text-xs font-medium text-g-blue">
                {myNote ? "Edit note" : "Add a note"}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 space-y-5">
          {viaShown.length === 0 && <Empty text={via.length ? "No matches." : "When people you met connect with others, they show up here."} />}
          {viaShown.map((g) => (
            <section key={g.via.id}>
              <h2 className="mb-2 flex items-center gap-2 text-sm text-muted">
                <Avatar name={g.via.name} src={g.via.avatar} size={20} />
                via <span className="font-medium text-ink">{g.via.name}</span>
              </h2>
              <ul className="divide-y divide-line rounded-2xl bg-white shadow-[0_1px_4px_rgba(60,64,67,0.1)]">
                {g.people.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 p-3">
                    <Avatar name={p.name} src={p.avatar} size={36} />
                    <div className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</div>
                    <ViewLinkedIn handle={p.handle} name={p.name} compact />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-12 text-center text-sm text-muted">{text}</p>;
}
