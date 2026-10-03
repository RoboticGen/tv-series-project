
export function errorMessage(err: unknown, fallback: string) {
  if (!(err instanceof Error) || !err.message) return fallback;
  try {
    const issues: unknown = JSON.parse(err.message);
    if (Array.isArray(issues)) {
      const messages = issues.map((issue) => issue?.message).filter((m) => typeof m === "string");
      if (messages.length > 0) return messages.join(". ");
    }
  } catch {}
  return err.message;
}
