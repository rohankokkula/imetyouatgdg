"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LinkedInButton({ next = "/", label = "Continue with LinkedIn" }: { next?: string; label?: string }) {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    // Store the redirect target in sessionStorage so callback can use it
    if (next !== "/") {
      sessionStorage.setItem("authNext", next);
    }
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  }

  return (
    <button
      onClick={signIn}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-full bg-li px-6 py-3.5 text-base font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-70"
    >
      <LinkedInIcon className="h-5 w-5" />
      {loading ? "Opening LinkedIn…" : label}
    </button>
  );
}

export function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0z" />
    </svg>
  );
}
