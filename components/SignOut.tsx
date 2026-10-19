"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOut() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut();
        router.refresh();
      }}
      className="text-sm text-muted underline-offset-4 hover:underline"
    >
      Sign out
    </button>
  );
}
