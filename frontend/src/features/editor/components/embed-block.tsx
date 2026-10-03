import type { ParsedEmbed } from "@/features/editor/embeds";

const PROVIDER_LABELS: Record<ParsedEmbed["provider"], string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  loom: "Loom",
  "google-drive": "Google Drive",
};

export function EmbedBlock({ embed }: { embed: ParsedEmbed }) {
  return (
    <div className="my-4 overflow-hidden rounded-lg border bg-muted">
      <div className="relative aspect-video w-full">
        <iframe
          src={embed.embedUrl}
          title={PROVIDER_LABELS[embed.provider]}
          className="absolute inset-0 size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}

export function EmbedFallback({ url }: { url: string }) {
  return (
    <div className="my-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
      Couldn&apos;t recognize this as a YouTube, Vimeo, Loom, or Google Drive
      link: <span className="break-all">{url}</span>
    </div>
  );
}
