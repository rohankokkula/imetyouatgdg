import { profileUrl } from "@/lib/linkedin";
import { LinkedInIcon } from "./LinkedInButton";

export function ViewLinkedIn({ handle, name, compact }: { handle: string | null; name: string; compact?: boolean }) {
  return (
    <a
      href={profileUrl(handle, name)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-full border border-li/30 font-semibold text-li transition active:scale-95 ${
        compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      }`}
    >
      <LinkedInIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {handle ? "View" : "Find"}
    </a>
  );
}
