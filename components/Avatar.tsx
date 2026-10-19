import { initials } from "@/lib/graph";

export function Avatar({ name, src, size = 48 }: { name: string; src: string | null; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} style={style} className="shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />;
  }
  return (
    <div style={style} className="flex shrink-0 items-center justify-center rounded-full bg-g-blue/15 font-semibold text-g-blue">
      {initials(name)}
    </div>
  );
}
