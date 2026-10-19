"use client";

import Link from "next/link";
import { useState } from "react";
import { ViewLinkedIn } from "@/components/ViewLinkedIn";
import { createClient } from "@/lib/supabase/client";

type Props = {
  targetId: string;
  targetName: string;
  targetHandle: string | null;
  alreadyConnected: boolean;
  initialNote: string;
  theirNote: string | null;
};

export function ConnectForm({ targetId, targetName, targetHandle, alreadyConnected, initialNote, theirNote }: Props) {
  const [note, setNote] = useState(initialNote);
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");
  const first = targetName.split(" ")[0];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    const supabase = createClient();
    const { error } = alreadyConnected
      ? await supabase.rpc("set_note", { other: targetId, note })
      : await supabase.rpc("connect", { target: targetId, note });
    if (error) {
      setStatus("idle");
      setError(error.message);
    } else {
      setStatus("done");
    }
  }

  if (status === "done") {
    return (
      <div className="mt-8 text-center">
        <div className="text-4xl">🎉</div>
        <h2 className="mt-2 text-xl font-semibold">
          {alreadyConnected ? "Note saved" : `You're connected with ${first}`}
        </h2>
        <div className="mt-4 flex justify-center">
          <ViewLinkedIn handle={targetHandle} name={targetName} />
        </div>
        <p className="mt-6 text-sm text-muted">Now show your QR to {first}, or to the next person you meet.</p>
        <Link href="/" className="mt-4 block w-full rounded-full bg-g-blue py-3.5 font-semibold text-white">
          Show my QR
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8">
      {alreadyConnected && (
        <p className="mb-4 rounded-2xl bg-g-green/10 px-4 py-3 text-center text-sm text-g-green">
          ✓ You&apos;re already connected
        </p>
      )}
      {theirNote && (
        <div className="mb-4 rounded-2xl bg-white px-4 py-3 text-sm shadow-[0_1px_4px_rgba(60,64,67,0.1)]">
          <div className="text-xs text-muted">{first}&apos;s note</div>
          {theirNote}
        </div>
      )}
      <label htmlFor="note" className="text-sm font-medium">
        Note to remember them by <span className="font-normal text-muted">(optional)</span>
      </label>
      <textarea
        id="note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Talked about Gemini agents, works at…"
        className="mt-2 w-full resize-none rounded-2xl border border-line bg-white p-4 outline-none focus:border-g-blue"
      />
      <p className="text-xs text-muted">Only you and {first} can see notes.</p>
      {error && <p className="mt-2 text-sm text-g-red">{error}</p>}
      <button
        disabled={status === "saving"}
        className="mt-5 w-full rounded-full bg-g-blue py-3.5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
      >
        {status === "saving" ? "Saving…" : alreadyConnected ? "Save note" : `Connect with ${first}`}
      </button>
      <div className="mt-4 flex justify-center">
        <ViewLinkedIn handle={targetHandle} name={targetName} compact />
      </div>
    </form>
  );
}
