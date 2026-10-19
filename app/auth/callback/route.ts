import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("linkedin_handle")
        .eq("id", user!.id)
        .maybeSingle();
      if (!profile?.linkedin_handle) {
        return NextResponse.redirect(`${origin}/onboarding?next=${encodeURIComponent(next)}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Surface what went wrong (LinkedIn/Supabase pass error_description back on failure).
  const reason = searchParams.get("error_description") ?? "auth";
  return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(reason)}`);
}
