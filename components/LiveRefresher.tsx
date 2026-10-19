"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Re-renders the current page when one of my connections changes (RLS limits events to my rows). */
export function LiveRefresher() {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("my-connections")
      .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, () => router.refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);
  return null;
}
