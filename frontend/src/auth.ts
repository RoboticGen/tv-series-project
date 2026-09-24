import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isDefaultAdmin } from "@/lib/admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      // Least-privilege scopes: identity only, nothing else from Google.
      authorization: { params: { scope: "openid email profile" } },
    }),
  ],
  session: {
    // No accounts/sessions tables in the Postgres schema (source of truth
    // is database/init/*.sql) -- JWT sessions avoid needing them. The JWT
    // itself only ever holds our own users.id and role, never Google
    // tokens.
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/landing",
    error: "/landing",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      // Reject unverified Google emails -- these can be spoofed by the
      // account holder themselves and must not be trusted for identity.
      if (!profile?.email_verified) return false;
      // Accounts an admin disabled can't sign back in.
      const [existing] = await db
        .select({ isDisabled: users.isDisabled })
        .from(users)
        .where(eq(users.googleId, account.providerAccountId));
      return !existing?.isDisabled;
    },
    async jwt({ token, account, profile }) {
      // Only runs on initial sign-in, when `account`/`profile` are present.
      // Every subsequent request reuses the already-encrypted token.
      if (account && profile?.email && account.providerAccountId) {
        const googleId = account.providerAccountId;
        const adminRole = isDefaultAdmin(profile.email) ? { role: "admin" as const } : {};
        const [dbUser] = await db
          .insert(users)
          .values({
            googleId,
            email: profile.email,
            displayName: (profile.name as string | undefined) ?? profile.email,
            avatarUrl: (profile.picture as string | undefined) ?? null,
            lastLoginAt: new Date(),
            ...adminRole,
          })
          .onConflictDoUpdate({
            target: users.googleId,
            set: {
              email: profile.email,
              displayName: (profile.name as string | undefined) ?? profile.email,
              avatarUrl: (profile.picture as string | undefined) ?? null,
              lastLoginAt: new Date(),
              ...adminRole,
            },
          })
          .returning({ id: users.id, role: users.role });

        token.id = dbUser.id;
        token.role = dbUser.role;
      } else if (token.id) {
        // Keep the role in the token fresh (e.g. after a mentor/admin
        // promotion) without hitting Google again. Returning null drops
        // the session, so a user an admin deleted or disabled is signed
        // out on their next request instead of when the JWT expires.
        const [dbUser] = await db
          .select({ role: users.role, isDisabled: users.isDisabled })
          .from(users)
          .where(eq(users.id, token.id as string));
        if (!dbUser || dbUser.isDisabled) return null;
        token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as typeof session.user.role;
      return session;
    },
  },
  // Required when running behind a reverse proxy / non-Vercel host in
  // production so Auth.js trusts the forwarded host header. Safe here
  // because it only affects reading X-Forwarded-* from our own proxy.
  trustHost: true,
});
