export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { validateEnv } = await import("@/lib/config/env");
  validateEnv();
  const { startJobs } = await import("@/core/jobs");
  startJobs().catch((err) => console.error("Background jobs failed to start", err));
}
