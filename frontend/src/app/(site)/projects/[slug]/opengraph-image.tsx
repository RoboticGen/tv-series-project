import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { LEVELS } from "@/features/gamification/components/builder-level";
import { db } from "@/lib/db";
import { mediaAssets, projects, users } from "@/lib/db/schema";
import { CATEGORY_LABELS } from "@/features/projects/categories";
import { getUploadedFile } from "@/services/storage";
import { SITE_NAME } from "@/lib/config/site";

export const alt = `A student project on ${SITE_NAME}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";


export const revalidate = 3600;

// Static TTFs
const [ralewayBlack, interBold] = await Promise.all([
  readFile(join(process.cwd(), "assets/fonts/Raleway-Black.ttf")),
  readFile(join(process.cwd(), "assets/fonts/Inter-Bold.ttf")),
]);

const NAVY = "#022f49";
const SKY_TINT = "#e8f3fc";
const TEAL = "#219cbc";
const YELLOW = "#fdb713";
const CORAL = "#e87a55";

// Builder-level fills as hex
const LEVEL_FILL: Record<string, string> = {
  "bg-brand-sky": "#54afe7",
  "bg-brand-green": "#43b268",
  "bg-brand-yellow": YELLOW,
  "bg-brand-coral": CORAL,
  "bg-brand-teal": TEAL,
};

const COVER = { width: 480, height: 400 };

async function getShareableProject(slug: string) {
  const [row] = await db
    .select({
      title: projects.title,
      category: projects.category,
      isFeatured: projects.isFeatured,
      authorName: users.displayName,
      authorPoints: users.points,
      coverPath: mediaAssets.filePath,
    })
    .from(projects)
    .innerJoin(users, eq(projects.authorId, users.id))
    .leftJoin(mediaAssets, eq(projects.coverImageId, mediaAssets.id))
    .where(and(eq(projects.slug, slug), eq(projects.status, "published")));
  return row ?? null;
}

// Normalises any upload
async function loadCover(path: string | null): Promise<string | null> {
  if (!path) return null;
  try {
    const stream = await getUploadedFile(path);
    if (!stream) return null;
    const jpeg = await sharp(Buffer.from(await new Response(stream).arrayBuffer()))
      .resize(COVER.width, COVER.height, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (err) {
    console.error(`Open Graph cover failed for "${path}"`, err);
    return null;
  }
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: 10,
          border: `4px solid ${NAVY}`,
          background: TEAL,
          color: "white",
          fontFamily: "Raleway",
          fontSize: 32,
          boxShadow: `4px 4px 0 0 ${NAVY}`,
        }}
      >
        R
      </div>
      <div style={{ display: "flex", fontFamily: "Raleway", fontSize: 30, color: NAVY }}>
        {SITE_NAME}
      </div>
    </div>
  );
}

function Chip({ label, background }: { label: string; background: string }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "6px 16px",
        borderRadius: 8,
        border: `3px solid ${NAVY}`,
        background,
        color: NAVY,
        fontSize: 22,
        letterSpacing: 1,
        textTransform: "uppercase",
        boxShadow: `3px 3px 0 0 ${NAVY}`,
      }}
    >
      {label}
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: 56,
        gap: 56,
        alignItems: "center",
        background: SKY_TINT,
        borderBottom: `16px solid ${NAVY}`,
        fontFamily: "Inter",
        color: NAVY,
      }}
    >
      {children}
    </div>
  );
}

const fonts = [
  { name: "Raleway", data: ralewayBlack, weight: 900 as const, style: "normal" as const },
  { name: "Inter", data: interBold, weight: 700 as const, style: "normal" as const },
];

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getShareableProject(slug);

  if (!project) {
    return new ImageResponse(
      (
        <Frame>
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            <Logo />
            <div style={{ display: "flex", fontFamily: "Raleway", fontSize: 72, lineHeight: 1.05, maxWidth: 900 }}>
              Student robotics & maker projects
            </div>
          </div>
        </Frame>
      ),
      { ...size, fonts },
    );
  }

  const cover = await loadCover(project.coverPath);
  const level = LEVELS.findLast((l) => project.authorPoints >= l.minPoints) ?? LEVELS[0];
  const category = CATEGORY_LABELS[project.category] ?? "Project";

  return new ImageResponse(
    (
      <Frame>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", justifyContent: "space-between" }}>
          <Logo />
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", gap: 14 }}>
              <Chip label={category} background={YELLOW} />
              {project.isFeatured && <Chip label="Featured" background={CORAL} />}
            </div>
            {/* Smaller type for long titles so they can't collide with the author line. */}
            <div style={{ display: "flex", fontFamily: "Raleway", fontSize: project.title.length > 40 ? 50 : 64, lineHeight: 1.05 }}>
              {truncate(project.title, 70)}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28 }}>
            <div style={{ display: "flex" }}>by {truncate(project.authorName, 32)}</div>
            <div
              style={{
                display: "flex",
                padding: "4px 14px",
                borderRadius: 999,
                border: `3px solid ${NAVY}`,
                background: LEVEL_FILL[level.fill] ?? TEAL,
                fontSize: 22,
              }}
            >
              {level.name}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: COVER.width,
            height: COVER.height,
            flexShrink: 0,
            borderRadius: 16,
            border: `6px solid ${NAVY}`,
            boxShadow: `10px 10px 0 0 ${NAVY}`,
            background: TEAL,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {cover ? (
            <img src={cover} width={COVER.width} height={COVER.height} alt="" style={{ objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", fontFamily: "Raleway", fontSize: 200, color: "white" }}>R</div>
          )}
        </div>
      </Frame>
    ),
    { ...size, fonts },
  );
}
