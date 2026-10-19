"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

export function MyQR({ id, name }: { id: string; name: string }) {
  const [url, setUrl] = useState("");
  const [full, setFull] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setUrl(`${window.location.origin}/c/${id}`), [id]);

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: `Connect with ${name}`, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  if (!url) return <div className="aspect-square w-full max-w-[280px] animate-pulse rounded-3xl bg-line" />;

  return (
    <>
      <button
        onClick={() => setFull(true)}
        className="rounded-3xl bg-white p-5 shadow-[0_2px_16px_rgba(60,64,67,0.12)] transition active:scale-[0.98]"
        aria-label="Show QR full screen"
      >
        <QRCodeSVG value={url} size={240} level="M" marginSize={0} fgColor="#202124" />
      </button>
      <div className="mt-4 flex gap-2">
        <button onClick={() => setFull(true)} className="rounded-full bg-g-blue px-4 py-2 text-sm font-semibold text-white">
          Full screen
        </button>
        <button onClick={share} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink">
          {copied ? "Link copied" : "Share link"}
        </button>
      </div>

      {full && (
        <button
          onClick={() => setFull(false)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white p-6"
          aria-label="Close full screen QR"
        >
          <QRCodeSVG value={url} level="M" marginSize={0} fgColor="#202124" style={{ width: "min(85vw, 85vh)", height: "auto" }} />
          <div className="text-center">
            <div className="text-xl font-semibold">{name}</div>
            <div className="text-sm text-muted">Scan with your camera to connect · tap to close</div>
          </div>
        </button>
      )}
    </>
  );
}
