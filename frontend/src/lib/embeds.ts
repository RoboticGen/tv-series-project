// oEmbed-style link -> iframe resolution. Each provider only ever hands
// back a URL WE construct from a validated id -- the caller's raw link is
// never used directly as an iframe src, which keeps this safe against
// embedding arbitrary/untrusted origins.
export type EmbedProvider = "youtube" | "vimeo" | "loom" | "google-drive";

export interface ParsedEmbed {
  provider: EmbedProvider;
  embedUrl: string;
}

interface ProviderMatcher {
  id: EmbedProvider;
  match: (url: URL) => string | null;
}

const PROVIDERS: ProviderMatcher[] = [
  {
    id: "youtube",
    match: (url) => {
      const host = url.hostname.replace(/^www\.|^m\./, "");
      let id: string | null = null;
      if (host === "youtu.be") {
        id = url.pathname.slice(1).split("/")[0] || null;
      } else if (host === "youtube.com") {
        if (url.pathname === "/watch") id = url.searchParams.get("v");
        else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2];
        else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2];
      }
      return id ? `https://www.youtube.com/embed/${id}` : null;
    },
  },
  {
    id: "vimeo",
    match: (url) => {
      const host = url.hostname.replace(/^www\./, "");
      if (host !== "vimeo.com") return null;
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    },
  },
  {
    id: "loom",
    match: (url) => {
      const host = url.hostname.replace(/^www\./, "");
      if (host !== "loom.com") return null;
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] !== "share" || !parts[1]) return null;
      return `https://www.loom.com/embed/${parts[1]}`;
    },
  },
  {
    id: "google-drive",
    match: (url) => {
      const host = url.hostname.replace(/^www\./, "");
      if (host !== "drive.google.com") return null;
      const match = /\/file\/d\/([^/]+)/.exec(url.pathname);
      return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null;
    },
  },
];

export function parseEmbedUrl(raw: string): ParsedEmbed | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  for (const provider of PROVIDERS) {
    const embedUrl = provider.match(url);
    if (embedUrl) return { provider: provider.id, embedUrl };
  }
  return null;
}
