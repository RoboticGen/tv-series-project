import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

// Google's signing keys for ID tokens
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const GOOGLE_ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

export interface GoogleIdentity {
  googleId: string;
  email: string;
  name: string | null;
  picture: string | null;
}

export async function verifyGoogleIdToken(
  credential: string,
  clientId: string,
  keys: JWTVerifyGetKey = GOOGLE_JWKS,
): Promise<GoogleIdentity | null> {
  try {
    const { payload } = await jwtVerify(credential, keys, {
      issuer: GOOGLE_ISSUERS,
      audience: clientId,
    });

    if (payload.email_verified !== true) return null;
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return {
      googleId: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : null,
      picture: typeof payload.picture === "string" ? payload.picture : null,
    };
  } catch {
    return null;
  }
}
