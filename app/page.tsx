import Link from "next/link";
import { Brand } from "@/components/Brand";
import { LinkedInButton } from "@/components/LinkedInButton";
import { LiveRefresher } from "@/components/LiveRefresher";
import { MyQR } from "@/components/MyQR";
import { NavBar } from "@/components/NavBar";
import { SignOut } from "@/components/SignOut";
import { getEventGraph, reach } from "@/lib/graph";
import { createClient } from "@/lib/supabase/server";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <Landing error={(await searchParams).error} />;

  const graph = await getEventGraph(supabase);
  const me = graph.nodes.find((n) => n.id === user.id);
  const { dist } = reach(graph.links, user.id);
  const count = (d: number) => [...dist.values()].filter((v) => v === d).length;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center px-4 pb-28 pt-6">
      <LiveRefresher />
      <Brand className="self-start text-sm text-muted" />

      <h1 className="mt-6 text-center text-2xl font-semibold">Hi {me?.name.split(" ")[0] || "there"} 👋</h1>
      <p className="mt-1 text-center text-sm text-muted">Show this to anyone you meet. They scan it and you're connected.</p>

      <div className="mt-6 flex flex-col items-center">
        <MyQR id={user.id} name={me?.name ?? ""} />
      </div>

      {!me?.handle && (
        <Link href="/onboarding" className="mt-5 w-full rounded-2xl border border-g-yellow/50 bg-g-yellow/10 px-4 py-3 text-sm">
          ⚠️ Add your LinkedIn username so people can open your profile →
        </Link>
      )}

      <div className="mt-6 grid w-full grid-cols-3 gap-2">
        <Stat value={count(1)} label="Met directly" color="text-g-green" href="/people" />
        <Stat value={count(2)} label="Through them" color="text-g-yellow" href="/people?tab=via" />
        <Stat value={graph.nodes.length} label="At DevFest" color="text-g-blue" href="/graph" />
      </div>

      <div className="mt-8">
        <SignOut />
      </div>
      <NavBar />
    </main>
  );
}

function Stat({ value, label, color, href }: { value: number; label: string; color: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl bg-white p-3 text-center shadow-[0_1px_4px_rgba(60,64,67,0.1)]">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </Link>
  );
}

function Landing({ error }: { error?: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-10">
      <Brand />
      <div>
        <h1 className="text-4xl font-bold leading-tight tracking-tight">
          Met someone at <span className="text-g-blue">DevFest</span>?<br />
          Don&apos;t lose them.
        </h1>
        <p className="mt-4 text-muted">
          Get your personal QR. Everyone who scans it becomes a connection. Add a note so you remember why, and see who
          your connections met too.
        </p>
        <ol className="mt-6 space-y-2 text-sm">
          <li>
            <b className="text-g-blue">1.</b> Sign in with LinkedIn
          </li>
          <li>
            <b className="text-g-red">2.</b> Show your QR to people you meet
          </li>
          <li>
            <b className="text-g-green">3.</b> Watch the DevFest graph grow
          </li>
        </ol>
      </div>
      <div>
        {error && <p className="mb-3 text-center text-sm text-g-red">Sign-in didn&apos;t complete. Please try again.</p>}
        <LinkedInButton />
        <p className="mt-3 text-center text-xs text-muted">GDG DevFest Hyderabad · community project</p>
      </div>
    </main>
  );
}
