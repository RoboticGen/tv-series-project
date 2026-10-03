import { beforeAll, describe, expect, it } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type CryptoKey, type JWTVerifyGetKey } from "jose";
import { verifyGoogleIdToken } from "@/lib/auth/google-id-token";

const CLIENT_ID = "test-client.apps.googleusercontent.com";

let privateKey: CryptoKey;
let keys: JWTVerifyGetKey;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  keys = createLocalJWKSet({ keys: [{ ...(await exportJWK(pair.publicKey)), kid: "k1", alg: "RS256" }] });
});

function token(
  claims: Record<string, unknown> = {},
  { issuer = "https://accounts.google.com", audience = CLIENT_ID, expiresIn = "1h", key = () => privateKey } = {},
) {
  return new SignJWT({ email: "ada@example.com", email_verified: true, name: "Ada", picture: "https://x/p.png", ...claims })
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setSubject("google-sub-123")
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key());
}

describe("verifyGoogleIdToken", () => {
  it("returns the identity for a valid token", async () => {
    await expect(verifyGoogleIdToken(await token(), CLIENT_ID, keys)).resolves.toEqual({
      googleId: "google-sub-123",
      email: "ada@example.com",
      name: "Ada",
      picture: "https://x/p.png",
    });
  });

  it("accepts the bare accounts.google.com issuer", async () => {
    const result = await verifyGoogleIdToken(await token({}, { issuer: "accounts.google.com" }), CLIENT_ID, keys);
    expect(result?.googleId).toBe("google-sub-123");
  });

  it("defaults missing name/picture to null", async () => {
    const result = await verifyGoogleIdToken(await token({ name: undefined, picture: undefined }), CLIENT_ID, keys);
    expect(result).toMatchObject({ name: null, picture: null });
  });

  it("rejects an unverified email", async () => {
    await expect(verifyGoogleIdToken(await token({ email_verified: false }), CLIENT_ID, keys)).resolves.toBeNull();
  });

  it("rejects a token issued for another client", async () => {
    const other = await token({}, { audience: "someone-else" });
    await expect(verifyGoogleIdToken(other, CLIENT_ID, keys)).resolves.toBeNull();
  });

  it("rejects a token from another issuer", async () => {
    const other = await token({}, { issuer: "https://evil.example" });
    await expect(verifyGoogleIdToken(other, CLIENT_ID, keys)).resolves.toBeNull();
  });

  it("rejects an expired token", async () => {
    const expired = await token({}, { expiresIn: "-1m" });
    await expect(verifyGoogleIdToken(expired, CLIENT_ID, keys)).resolves.toBeNull();
  });

  it("rejects a token signed with a different key", async () => {
    const { privateKey: attackerKey } = await generateKeyPair("RS256");
    const forged = await token({}, { key: () => attackerKey });
    await expect(verifyGoogleIdToken(forged, CLIENT_ID, keys)).resolves.toBeNull();
  });

  it("rejects garbage", async () => {
    await expect(verifyGoogleIdToken("not-a-jwt", CLIENT_ID, keys)).resolves.toBeNull();
  });
});
