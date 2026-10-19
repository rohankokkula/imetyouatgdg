"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseHandle } from "@/lib/linkedin";
import { createClient } from "@/lib/supabase/client";

export function HandleForm({ userId, initial, next }: { userId: string; initial: string; next: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const handle = parseHandle(value);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!handle) return setError("That doesn't look like a LinkedIn profile link or username.");
    setSaving(true);
    const { error } = await createClient().from("profiles").update({ linkedin_handle: handle }).eq("id", userId);
    if (error) {
      setSaving(false);
      return setError(error.message);
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="mt-6">
      <label className="text-sm font-medium" htmlFor="handle">
        Your LinkedIn profile
      </label>
      <div className="mt-2 flex items-center rounded-2xl border border-line bg-white px-4 focus-within:border-g-blue">
        <span className="text-sm text-muted">linkedin.com/in/</span>
        <input
          id="handle"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder="your-name"
          className="min-w-0 flex-1 bg-transparent py-3.5 pl-0.5 outline-none"
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        Tip: in the LinkedIn app, open your profile → ⋯ → Share via → Copy link, then paste it here.
      </p>
      {handle && value.trim() !== handle && <p className="mt-2 text-xs text-g-green">✓ Got it: {handle}</p>}
      {error && <p className="mt-2 text-sm text-g-red">{error}</p>}

      <button disabled={saving} className="mt-6 w-full rounded-full bg-g-blue py-3.5 font-semibold text-white disabled:opacity-60">
        {saving ? "Saving…" : "Continue"}
      </button>
      <button
        type="button"
        onClick={() => router.replace(next)}
        className="mt-3 w-full py-2 text-sm text-muted"
      >
        Skip for now
      </button>
    </form>
  );
}
