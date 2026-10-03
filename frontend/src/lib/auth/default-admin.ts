
export function isDefaultAdmin(email: string | null | undefined) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return !!adminEmail && email?.trim().toLowerCase() === adminEmail;
}
