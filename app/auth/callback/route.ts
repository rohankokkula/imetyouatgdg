import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

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
        return NextResponse.redirect(`${origin}/onboarding`);
      }
      // Check sessionStorage for where to go next (set by LinkedInButton)
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
