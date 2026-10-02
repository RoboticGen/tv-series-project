import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { sessionHolder } from "../setup/global-mocks";

vi.mock("@/auth", () => ({
  auth: (handler: (req: NextRequest & { auth: unknown }) => unknown) => (req: NextRequest) =>
    handler(Object.assign(req, { auth: sessionHolder.session })),
}));

const { default: proxy, config } = await import("@/proxy");

function visitHome() {
  return (proxy as unknown as (req: NextRequest) => Response | undefined)(
    new NextRequest("http://localhost:3000/"),
  );
}

describe("proxy", () => {
  it("sends signed-in users from / to their dashboard", () => {
    sessionHolder.session = { user: { id: "user-1", role: "student" } };

    const res = visitHome();

    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("shows the landing page to signed-out visitors", () => {
    sessionHolder.session = null;

    expect(visitHome()).toBeUndefined();
  });

  it("only runs on the homepage", () => {
    expect(config.matcher).toBe("/");
  });
});
