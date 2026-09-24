import { describe, expect, it } from "vitest";
import { parseEmbedUrl } from "@/lib/embeds";

describe("parseEmbedUrl / youtube", () => {
  it("resolves a standard watch URL", () => {
    expect(parseEmbedUrl("https://www.youtube.com/watch?v=abc123")).toEqual({
      provider: "youtube",
      embedUrl: "https://www.youtube.com/embed/abc123",
    });
  });

  it("resolves youtu.be short links", () => {
    expect(parseEmbedUrl("https://youtu.be/abc123")).toEqual({
      provider: "youtube",
      embedUrl: "https://www.youtube.com/embed/abc123",
    });
  });

  it("resolves youtu.be short links with a trailing path segment", () => {
    expect(parseEmbedUrl("https://youtu.be/abc123/extra")).toEqual({
      provider: "youtube",
      embedUrl: "https://www.youtube.com/embed/abc123",
    });
  });

  it("resolves /shorts/ URLs", () => {
    expect(parseEmbedUrl("https://www.youtube.com/shorts/abc123")).toEqual({
      provider: "youtube",
      embedUrl: "https://www.youtube.com/embed/abc123",
    });
  });

  it("resolves an already-embed URL", () => {
    expect(parseEmbedUrl("https://www.youtube.com/embed/abc123")).toEqual({
      provider: "youtube",
      embedUrl: "https://www.youtube.com/embed/abc123",
    });
  });

  it("normalizes www. and m. host prefixes", () => {
    expect(parseEmbedUrl("https://m.youtube.com/watch?v=abc123")).toEqual({
      provider: "youtube",
      embedUrl: "https://www.youtube.com/embed/abc123",
    });
  });

  it("returns null for a youtube.com URL with no recognizable video id", () => {
    expect(parseEmbedUrl("https://www.youtube.com/channel/xyz")).toBeNull();
  });
});

describe("parseEmbedUrl / vimeo", () => {
  it("resolves a numeric vimeo URL", () => {
    expect(parseEmbedUrl("https://vimeo.com/12345678")).toEqual({
      provider: "vimeo",
      embedUrl: "https://player.vimeo.com/video/12345678",
    });
  });

  it("rejects a non-numeric vimeo path", () => {
    expect(parseEmbedUrl("https://vimeo.com/some-slug")).toBeNull();
  });
});

describe("parseEmbedUrl / loom", () => {
  it("resolves a loom share URL", () => {
    expect(parseEmbedUrl("https://www.loom.com/share/abc123def")).toEqual({
      provider: "loom",
      embedUrl: "https://www.loom.com/embed/abc123def",
    });
  });

  it("rejects a loom URL that isn't a /share/ link", () => {
    expect(parseEmbedUrl("https://www.loom.com/embed/abc123def")).toBeNull();
  });
});

describe("parseEmbedUrl / google-drive", () => {
  it("resolves a /file/d/<id>/... URL to a /preview embed", () => {
    expect(parseEmbedUrl("https://drive.google.com/file/d/abc123/view?usp=sharing")).toEqual({
      provider: "google-drive",
      embedUrl: "https://drive.google.com/file/d/abc123/preview",
    });
  });

  it("rejects a drive URL with no /file/d/ segment", () => {
    expect(parseEmbedUrl("https://drive.google.com/drive/folders/abc123")).toBeNull();
  });
});

describe("parseEmbedUrl / general validation", () => {
  it("returns null for an unparseable string", () => {
    expect(parseEmbedUrl("not a url")).toBeNull();
  });

  it("returns null for an unsupported provider", () => {
    expect(parseEmbedUrl("https://example.com/video/1")).toBeNull();
  });

  // Security-relevant: only http(s) may ever produce an iframe src.
  it("rejects non-http(s) protocols such as javascript:", () => {
    expect(parseEmbedUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects data: URLs", () => {
    expect(parseEmbedUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(parseEmbedUrl("  https://youtu.be/abc123  ")).toEqual({
      provider: "youtube",
      embedUrl: "https://www.youtube.com/embed/abc123",
    });
  });
});
