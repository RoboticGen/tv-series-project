// Seeds one published demo project (author, cover image, steps) so pages
// like the link-preview card have something real to render locally.
//
//   node --env-file=.env scripts/seed-demo-project.mjs          # create (or recreate)
//   node --env-file=.env scripts/seed-demo-project.mjs --remove # clean up
//
// Uses the same DATABASE_URL / MONGODB_* / S3_* settings as the app. The
// cover is uploaded to S3_BUCKET under project/<project id>/, exactly like a
// real upload, and removed again by --remove.
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { MongoClient, ObjectId } from "mongodb";
import postgres from "postgres";
import sharp from "sharp";

const SLUG = "demo-line-following-robot";
const AUTHOR_GOOGLE_ID = "demo-seed-author";
const REVIEWER_GOOGLE_ID = "demo-seed-reviewer";

const sql = postgres(process.env.DATABASE_URL);
const mongo = new MongoClient(process.env.MONGODB_URI);
const s3 = new S3Client({
  region: process.env.S3_REGION ?? process.env.AWS_REGION,
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: Boolean(process.env.S3_ENDPOINT),
});
const contentDocs = () => mongo.db(process.env.MONGODB_DB).collection("content_docs");

async function remove() {
  const [project] = await sql`
    SELECT p.id, p.content_doc_id, m.file_path
    FROM projects p LEFT JOIN media_assets m ON m.id = p.cover_image_id
    WHERE p.slug = ${SLUG}`;
  if (project) {
    // media_assets rows go with the project (trg_projects_cascade_media).
    await sql`DELETE FROM projects WHERE id = ${project.id}`;
    if (project.file_path) {
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: project.file_path }));
    }
  }
  // Tagged at insert, so a half-finished earlier run is cleaned up too.
  await contentDocs().deleteMany({ demoSeed: true });
  await sql`DELETE FROM users WHERE google_id IN (${AUTHOR_GOOGLE_ID}, ${REVIEWER_GOOGLE_ID})`;
  console.log(project ? `Removed /projects/${SLUG}` : "No demo project found; removed demo users if any.");
}

// A simple flat illustration in the site palette, so the card shows a
// recognisable "photo" rather than a solid block.
function coverSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <rect width="1200" height="900" fill="#54afe7"/>
  <rect y="620" width="1200" height="280" fill="#e8f3fc"/>
  <path d="M0 760 C 300 700, 500 820, 800 760 S 1100 700, 1200 740" stroke="#022f49" stroke-width="28" fill="none"/>
  <g stroke="#022f49" stroke-width="14" stroke-linejoin="round">
    <rect x="380" y="300" width="440" height="300" rx="36" fill="#fdb713"/>
    <rect x="470" y="190" width="260" height="130" rx="28" fill="#219cbc"/>
    <circle cx="545" cy="255" r="26" fill="#ffffff"/>
    <circle cx="655" cy="255" r="26" fill="#ffffff"/>
    <line x1="600" y1="190" x2="600" y2="120"/>
    <circle cx="600" cy="110" r="20" fill="#e87a55"/>
    <circle cx="450" cy="620" r="70" fill="#022f49"/>
    <circle cx="750" cy="620" r="70" fill="#022f49"/>
    <rect x="470" y="380" width="260" height="120" rx="18" fill="#43b268"/>
  </g>
  <circle cx="545" cy="255" r="10" fill="#022f49"/>
  <circle cx="655" cy="255" r="10" fill="#022f49"/>
</svg>`;
}

async function create() {
  await remove();

  const [author] = await sql`
    INSERT INTO users (google_id, email, display_name, points)
    VALUES (${AUTHOR_GOOGLE_ID}, 'demo.author@example.com', 'Kasun Perera', 75)
    RETURNING id`;
  const [reviewer] = await sql`
    INSERT INTO users (google_id, email, display_name, role)
    VALUES (${REVIEWER_GOOGLE_ID}, 'demo.mentor@example.com', 'Demo Mentor', 'mentor')
    RETURNING id`;

  const projectId = randomUUID();
  const docId = new ObjectId();
  const now = new Date();
  await contentDocs().insertOne({
    _id: docId,
    ownerType: "project",
    ownerId: projectId,
    demoSeed: true,
    steps: [
      {
        id: "step-parts",
        title: "Gather the parts",
        images: [],
        body: "- Arduino Uno\n- 2 × TT gear motors with wheels\n- L298N motor driver\n- 5-channel IR line sensor\n- 7.4 V Li-ion pack",
      },
      {
        id: "step-tune",
        title: "Tune the PID loop",
        images: [],
        body: "Start with **Kp** only until the robot oscillates around the line, then add **Kd** to damp it. A small **Ki** fixes drift on long curves.",
      },
    ],
    createdAt: now,
    updatedAt: now,
  });

  await sql`
    INSERT INTO projects (id, author_id, category, title, slug, summary, content_doc_id,
                          status, published_at, reviewed_by, reviewed_at, is_featured)
    VALUES (${projectId}, ${author.id}, 'robotics', 'Line Following Robot with PID Control', ${SLUG},
            'An Arduino robot that follows a black line smoothly using a tuned PID controller.',
            ${docId.toString()}, 'published', ${now}, ${reviewer.id}, ${now}, true)`;

  const key = `project/${projectId}/${randomUUID()}.png`;
  const png = await sharp(Buffer.from(coverSvg())).png().toBuffer();
  await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: png, ContentType: "image/png" }));
  const [asset] = await sql`
    INSERT INTO media_assets (owner_type, owner_id, file_path)
    VALUES ('project', ${projectId}, ${key})
    RETURNING id`;
  await sql`UPDATE projects SET cover_image_id = ${asset.id} WHERE id = ${projectId}`;

  console.log(`Created /projects/${SLUG}`);
  console.log(`Card:    /projects/${SLUG}/opengraph-image`);
}

try {
  await (process.argv.includes("--remove") ? remove() : create());
} finally {
  await sql.end();
  await mongo.close();
}
