import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import { HandleForm } from "./HandleForm";

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("name, linkedin_handle").eq("id", user.id).single();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-semibold">One last thing, {profile?.name.split(" ")[0] || "friend"}</h1>
      <p className="mt-2 text-sm text-muted">
        LinkedIn doesn&apos;t share your profile link with apps. Paste it here so people you meet can open it in one tap.
      </p>
      <HandleForm userId={user.id} initial={profile?.linkedin_handle ?? ""} next={next} />
    </main>
  );
}
