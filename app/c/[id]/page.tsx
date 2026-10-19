import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Brand } from "@/components/Brand";
import { LinkedInButton } from "@/components/LinkedInButton";
import { createClient } from "@/lib/supabase/server";
import { ConnectForm } from "./ConnectForm";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ConnectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const card = UUID.test(id) ? (await supabase.rpc("public_card", { uid: id })).data?.[0] : null;
  if (!card) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold">This QR code isn&apos;t valid</h1>
        <p className="mt-2 text-sm text-muted">Ask them to open the app and show their QR again.</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-g-blue">
          Get your own QR →
        </Link>
      </Shell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const header = (
    <div className="flex flex-col items-center text-center">
      <Avatar name={card.name} src={card.avatar_url} size={96} />
      <p className="mt-4 text-sm text-muted">You met</p>
      <h1 className="text-2xl font-semibold">{card.name}</h1>
    </div>
  );

  if (!user) {
    return (
      <Shell>
        {header}
        <p className="mt-6 text-center text-sm text-muted">
          Sign in with LinkedIn to save this connection, add a note, and get your own QR code.
        </p>
        <div className="mt-6">
          <LinkedInButton next={`/c/${id}`} label="Connect with LinkedIn" />
        </div>
      </Shell>
    );
  }

  if (user.id === id) {
    return (
      <Shell>
        {header}
        <p className="mt-6 text-center text-muted">This is your own QR code 🙂 Show it to someone else.</p>
        <Link href="/" className="mt-6 block w-full rounded-full bg-g-blue py-3.5 text-center font-semibold text-white">
          Show my QR
        </Link>
      </Shell>
    );
  }

  const [a, b] = [user.id, id].sort();
  const [{ data: existing }, { data: target }] = await Promise.all([
    supabase.from("connections").select("user_a, note_a, note_b").eq("user_a", a).eq("user_b", b).maybeSingle(),
    supabase.from("profiles").select("linkedin_handle").eq("id", id).single(),
  ]);
  const myNote = existing ? (existing.user_a === user.id ? existing.note_a : existing.note_b) : null;
  const theirNote = existing ? (existing.user_a === user.id ? existing.note_b : existing.note_a) : null;

  return (
    <Shell>
      {header}
      <ConnectForm
        targetId={id}
        targetName={card.name}
        targetHandle={target?.linkedin_handle ?? null}
        alreadyConnected={!!existing}
        initialNote={myNote ?? ""}
        theirNote={theirNote}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <Brand className="text-sm text-muted" />
      <div className="flex flex-1 flex-col justify-center py-8">{children}</div>
    </main>
  );
}
