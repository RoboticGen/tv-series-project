import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isDefaultAdmin } from "@/lib/auth/default-admin";
import { GOOGLE_ID_TOKEN_PROVIDER } from "@/lib/auth/providers";
import { verifyGoogleIdToken, type GoogleIdentity } from "@/lib/auth/google-id-token";

async function upsertGoogleUser({ googleId, email, name, picture }: GoogleIdentity) {
  const adminRole = isDefaultAdmin(email) ? { role: "admin" as const } : {};
  const fields = {
    email,
    displayName: name ?? email,
    avatarUrl: picture,
    lastLoginAt: new Date(),
    ...adminRole,
  };
  const [dbUser] = await db
    .insert(users)
    .values({ googleId, ...fields })
    .onConflictDoUpdate({ target: users.googleId, set: fields })
    .returning({ id: users.id, role: users.role });
  return dbUser;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      authorization: { params: { scope: "openid email profile" } },
    }),
    Credentials({
      id: GOOGLE_ID_TOKEN_PROVIDER,
      name: "Google",
      credentials: { credential: {} },
      async authorize(credentials) {
        if (typeof credentials?.credential !== "string" || !process.env.CLIENT_ID) return null;
        const identity = await verifyGoogleIdToken(credentials.credential, process.env.CLIENT_ID);
        if (!identity) return null;
        return {
          id: identity.googleId,
          email: identity.email,
          name: identity.name,
          image: identity.picture,
        };
      },
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
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        // Reject unverified Google emails -- these can be spoofed by the
        // account holder themselves and must not be trusted for identity.
        if (!profile?.email_verified) return false;
      } else if (account?.provider !== GOOGLE_ID_TOKEN_PROVIDER) {
        // The ID-token flow already checked email_verified in verifyGoogleIdToken.
        return false;
      }
      // Accounts an admin disabled can't sign back in.
      const [existing] = await db
        .select({ isDisabled: users.isDisabled })
        .from(users)
        .where(eq(users.googleId, account.providerAccountId));
      return !existing?.isDisabled;
    },
    async jwt({ token, account, profile, user }) {
      // Only runs on initial sign-in, when `account` is present. Every
      // subsequent request reuses the already-encrypted token. The redirect
      // flow carries identity in `profile`; the ID-token flow (a
      // credentials provider) has no profile and carries it in the `user`
      // that authorize() returned.
      const fromProfile = account?.provider === "google";
      const email = fromProfile ? profile?.email : user?.email;
      if (account?.providerAccountId && email) {
        const dbUser = await upsertGoogleUser({
          googleId: account.providerAccountId,
          email,
          name: (fromProfile ? profile?.name : user?.name) ?? null,
          picture: (fromProfile ? (profile?.picture as string | undefined) : user?.image) ?? null,
        });
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
