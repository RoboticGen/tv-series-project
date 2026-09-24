// The bootstrap admin from ADMIN_EMAIL. Always granted the admin role on
// sign-in (src/auth.ts) and protected from demotion/disable/delete in
// src/actions/admin.ts, so the platform can never lose its last admin.
export function isDefaultAdmin(email: string | null | undefined) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return !!adminEmail && email?.trim().toLowerCase() === adminEmail;
}
