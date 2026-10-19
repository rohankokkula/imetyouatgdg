export function Brand({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <span className="flex gap-0.5" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-g-blue" />
        <span className="h-2.5 w-2.5 rounded-full bg-g-red" />
        <span className="h-2.5 w-2.5 rounded-full bg-g-yellow" />
        <span className="h-2.5 w-2.5 rounded-full bg-g-green" />
      </span>
      I Met You At GDG
    </div>
  );
}
