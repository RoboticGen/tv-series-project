import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/actions/projects";
import { getContentDoc } from "@/db/content";
import { StepsViewer } from "@/components/steps-viewer";
import { CATEGORY_LABELS } from "@/lib/categories";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

// Print-only rendering target for the PDF route (src/app/api/projects/[slug]/pdf) --
// no header/nav, no like/favorite/comment buttons. Never linked to from the
// regular UI; Puppeteer navigates here directly and screenshots it to PDF.
export default async function ProjectPrintPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project = await getProjectBySlug(slug);
  if (!project || project.status !== "published") notFound();

  const steps = await getContentDoc(project.contentDocId);

  return (
    <div
      style={{
        margin: 0,
        padding: "48px 56px",
        background: "#ffffff",
        color: "#1f2022",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      {project.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.coverImageUrl}
          alt={project.title}
          style={{
            width: "100%",
            maxHeight: 360,
            objectFit: "cover",
            borderRadius: 8,
            marginBottom: 24,
          }}
        />
      ) : null}

      <p style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#939598" }}>
        {CATEGORY_LABELS[project.category] ?? project.category}
      </p>

      <h1 style={{ fontSize: 30, fontWeight: 700, margin: "8px 0", color: "#022f49" }}>
        {project.title}
      </h1>

      {project.summary ? (
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "#1f2022" }}>{project.summary}</p>
      ) : null}

      <p style={{ fontSize: 13, color: "#939598", margin: "16px 0 32px" }}>
        By {project.authorName} &middot;{" "}
        {dateFormatter.format(project.publishedAt ?? project.createdAt)}
      </p>

      <div style={{ borderTop: "1px solid rgba(147, 149, 152, 0.4)", paddingTop: 24 }}>
        <div data-color-mode="light">
          <StepsViewer steps={steps ?? []} />
        </div>
      </div>
    </div>
  );
}
