import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { signupSchema, weddingSchema } from "../src/lib/validation";
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
} from "../src/lib/server/accounts";
import { createWedding } from "../src/lib/server/weddings";
import { currentAccount } from "../src/lib/server/auth";
import { database } from "../src/lib/server/db";
import {
  User,
  Session,
  Membership,
  Wedding,
  ResetToken,
  RateLimit,
} from "../src/lib/server/models";
import {
  newToken,
  tokenHash,
  cookieOptions,
  hashPassword,
  verifyPassword,
} from "../src/lib/server/security";
import { authLimit, rateLimit } from "../src/lib/server/rate-limit";
import { body, endpoint, json } from "../src/lib/server/http";
import { GET as me } from "../src/app/api/auth/me/route";
import {
  GET as getWedding,
  POST as postWedding,
} from "../src/app/api/wedding/route";
import { POST as logout } from "../src/app/api/auth/logout/route";
import { POST as recover } from "../src/app/api/auth/forgot-password/route";
import { POST as register } from "../src/app/api/auth/signup/route";

const jar = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { value: jar.get(name) } : undefined,
    set: (name: string, value: string) => jar.set(name, value),
  }),
}));
let replica: MongoMemoryReplSet;
const account = {
  name: "Aanya",
  email: "aanya@example.com",
  password: "a memorable password",
};
const wedding = {
  brideName: "Aanya",
  groomName: "Kabir",
  weddingDate: "2027-02-14",
  timeZone: "Asia/Kolkata",
  location: { formattedAddress: "Jaipur, Rajasthan" },
};
const request = (
  payload: unknown,
  path = "/api/wedding",
  origin = "http://localhost:3000",
) =>
  new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

beforeAll(async () => {
  replica = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: {
      systemBinary: process.env.MONGOMS_SYSTEM_BINARY,
      version: process.env.MONGOMS_VERSION || "7.0.24",
    },
  });
  process.env.MONGODB_URI = replica.getUri("onboarding_test");
  process.env.AUTH_SECRET = "isolated-test-secret-not-for-production-12345";
  process.env.APP_URL = "http://localhost:3000";
  process.env.RESEND_API_KEY = "test-key";
  process.env.EMAIL_FROM = "test@example.com";
  await database();
});
beforeEach(async () => {
  jar.clear();
  vi.restoreAllMocks();
  await Promise.all([
    User.deleteMany({}),
    Session.deleteMany({}),
    ResetToken.deleteMany({}),
    Wedding.deleteMany({}),
    Membership.deleteMany({}),
    RateLimit.deleteMany({}),
  ]);
});
afterAll(async () => {
  await mongoose.disconnect();
  await replica?.stop();
});

describe("validation and request boundaries", () => {
  it("normalizes email without provider-specific transformations", () => {
    expect(
      signupSchema.parse({ ...account, email: "  A.AnYa+Wedding@Example.com " })
        .email,
    ).toBe("a.anya+wedding@example.com");
  });
  it("rejects bcrypt truncation, short passwords, unknown fields, impossible dates, and invalid zones", () => {
    for (const password of ["short", "a".repeat(73), "💍".repeat(19)])
      expect(signupSchema.safeParse({ ...account, password }).success).toBe(
        false,
      );
    expect(signupSchema.safeParse({ ...account, role: "ADMIN" }).success).toBe(
      false,
    );
    expect(
      weddingSchema.safeParse({ ...wedding, weddingDate: "2027-02-30" })
        .success,
    ).toBe(false);
    expect(
      weddingSchema.safeParse({ ...wedding, timeZone: "Imaginary/Zone" })
        .success,
    ).toBe(false);
  });
  it("rejects cross-origin, missing-origin, oversized, and malformed requests before mutation", async () => {
    await expect(
      body(
        request(account, "/api/auth/signup", "https://attacker.example"),
        signupSchema,
      ),
    ).rejects.toMatchObject({ status: 403 });
    const missing = request(account);
    missing.headers.delete("origin");
    await expect(body(missing, signupSchema)).rejects.toMatchObject({
      status: 403,
    });
    const malformed = new Request("http://localhost:3000", {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
        "Content-Type": "application/json",
      },
      body: "{",
    });
    await expect(body(malformed, signupSchema)).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      body(request({ name: "a".repeat(17000) }), signupSchema),
    ).rejects.toMatchObject({ status: 413 });
    expect(await User.countDocuments()).toBe(0);
  });
  it("returns field errors and does not expose internal error details", async () => {
    const response = await register(
      request({ ...account, password: "short" }, "/api/auth/signup"),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.fields.password).toBeDefined();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await endpoint(async () => {
      throw new Error("secret-database-uri");
    })(request({}));
    expect(result.status).toBe(503);
    expect(await result.text()).not.toContain("secret-database-uri");
    expect(json({ ok: true }).headers.get("cache-control")).toBe("no-store");
  });
});

describe("accounts and sessions", () => {
  it("sets production cookie protections and refuses bcrypt-truncated login passwords", async () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      expect(cookieOptions()).toMatchObject({
        secure: true,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 2592000,
      });
    } finally {
      vi.unstubAllEnvs();
    }
    const password = "a".repeat(72);
    const hash = await hashPassword(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword(`${password}suffix`, hash)).toBe(false);
  });
  it("signs up atomically, stores only hashes, and rejects duplicate email races", async () => {
    const results = await Promise.allSettled([
      signup(account),
      signup(account),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(await User.countDocuments()).toBe(1);
    expect(await Session.countDocuments()).toBe(1);
    const user = await User.findOne().select("+passwordHash");
    expect(user!.passwordHash).not.toContain(account.password);
    expect(user!.passwordHash).toMatch(/^\$2[ab]\$12\$/);
    const result = results.find((result) => result.status === "fulfilled")!;
    if (result.status !== "fulfilled")
      throw new Error("Expected signup success");
    const session = await Session.findOne();
    expect(session!.tokenHash).not.toBe(result.value.token);
    expect(session!.tokenHash).toBe(tokenHash(`session:${result.value.token}`));
  });
  it("uses generic login errors and logs a user in with a new session", async () => {
    await signup(account);
    await expect(
      login({ email: account.email, password: "wrong" }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    });
    await expect(
      login({ email: "unknown@example.com", password: "wrong" }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    });
    const loggedIn = await login(account);
    expect(loggedIn.hasWedding).toBe(false);
    expect(await Session.countDocuments()).toBe(2);
  });
  it("checks expiry without waiting for TTL deletion and logout revokes sessions", async () => {
    const result = await signup(account);
    jar.set("mmm_session", result.token);
    expect((await currentAccount())?.user.email).toBe(account.email);
    await Session.updateMany(
      {},
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );
    expect(await currentAccount()).toBeNull();
    const loggedIn = await login(account);
    jar.set("mmm_session", loggedIn.token);
    expect((await logout(request({}))).status).toBe(200);
    jar.set("mmm_session", loggedIn.token);
    expect(await currentAccount()).toBeNull();
  });
});

describe("wedding ownership and concurrency", () => {
  it("requires authentication for private reads and creation", async () => {
    expect((await me(request({}))).status).toBe(401);
    expect((await getWedding(request({}))).status).toBe(401);
    expect((await postWedding(request(wedding))).status).toBe(401);
  });
  it("creates exactly one wedding and Admin membership under concurrent submissions", async () => {
    const result = await signup(account);
    const results = await Promise.allSettled([
      createWedding(result.user.id, wedding),
      createWedding(result.user.id, wedding),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(await Wedding.countDocuments()).toBe(1);
    expect(await Membership.countDocuments()).toBe(1);
    expect((await Membership.findOne())?.role).toBe("ADMIN");
    expect((await login(account)).hasWedding).toBe(true);
  });
  it("resolves wedding scope through membership and never returns token hashes", async () => {
    const a = await signup(account);
    const created = await createWedding(a.user.id, wedding);
    const b = await signup({ ...account, email: "kabir@example.com" });
    jar.set("mmm_session", b.token);
    const denied = await getWedding(
      new Request(`http://localhost:3000/api/wedding?weddingId=${created.id}`),
    );
    expect(denied.status).toBe(404);
    expect((await currentAccount())?.wedding).toBeNull();
    jar.set("mmm_session", a.token);
    const response = await getWedding(request({}));
    const text = await response.text();
    expect(text).toContain("Jaipur");
    expect(text).not.toContain("tokenHash");
    expect(text).not.toContain("passwordHash");
    await expect(createWedding(a.user.id, wedding)).rejects.toMatchObject({
      code: "ALREADY_HAS_WEDDING",
    });
  });
});

describe("password recovery", () => {
  it("preserves generic recovery responses even if delivery fails", async () => {
    await signup(account);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 503 }),
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const known = await recover(
      request({ email: account.email }, "/api/auth/forgot-password"),
    );
    const unknown = await recover(
      request({ email: "unknown@example.com" }, "/api/auth/forgot-password"),
    );
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(await known.json()).toEqual(await unknown.json());
  });
  it("sends a single-use reset link, invalidates all sessions, and rejects replay", async () => {
    const original = await signup(account);
    await login(account);
    let delivered = "";
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, options) => {
      delivered = String(options?.body);
      return new Response("{}", { status: 200 });
    });
    await forgotPassword(account.email);
    const token = delivered.match(/token=([a-f0-9]{64})/)![1];
    expect((await ResetToken.findOne())?.tokenHash).toBe(
      tokenHash(`reset:${token}`),
    );
    await resetPassword(token, "a new memorable password");
    expect(await Session.countDocuments()).toBe(0);
    expect(await ResetToken.countDocuments()).toBe(0);
    jar.set("mmm_session", original.token);
    expect(await currentAccount()).toBeNull();
    await expect(
      resetPassword(token, "another new password"),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
    await expect(login(account)).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
    expect(
      (await login({ ...account, password: "a new memorable password" })).user
        .email,
    ).toBe(account.email);
  });
  it("unknown emails create no token or email; delivery failure removes the unusable token", async () => {
    const send = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 503 }));
    await forgotPassword("unknown@example.com");
    expect(send).not.toHaveBeenCalled();
    expect(await ResetToken.countDocuments()).toBe(0);
    await signup(account);
    await expect(forgotPassword(account.email)).rejects.toMatchObject({
      code: "EMAIL_UNAVAILABLE",
    });
    expect(await ResetToken.countDocuments()).toBe(0);
  });
  it("rejects expired resets and permits only one concurrent redemption", async () => {
    const user = await signup(account);
    const expired = newToken();
    const fresh = newToken();
    await ResetToken.create({
      userId: user.user.id,
      tokenHash: tokenHash(`reset:${expired}`),
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(
      resetPassword(expired, "a new memorable password"),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
    await ResetToken.create({
      userId: user.user.id,
      tokenHash: tokenHash(`reset:${fresh}`),
      expiresAt: new Date(Date.now() + 60000),
    });
    const results = await Promise.allSettled([
      resetPassword(fresh, "a new memorable password"),
      resetPassword(fresh, "another new password"),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
  });
});

describe("shared persistent rate limits", () => {
  it.each([
    ["signup", 5],
    ["login", 10],
    ["forgot", 3],
    ["reset", 10],
  ] as const)(
    "keeps %s available to other identities after repeated blocked attempts",
    async (action, limit) => {
      // Pin the clock away from a fixed-window boundary.
      const now = vi
        .spyOn(Date, "now")
        .mockReturnValue(new Date("2030-01-01T12:30:00Z").getTime());
      try {
        for (let i = 0; i < limit; i++)
          await authLimit(action, "blocked-identity");
        for (let i = 0; i < 100; i++) {
          await expect(
            authLimit(action, "blocked-identity"),
          ).rejects.toMatchObject({ status: 429, code: "RATE_LIMITED" });
        }
        await expect(
          authLimit(action, "unrelated-identity"),
        ).resolves.toBeUndefined();
        // High traffic from distinct identities must not cause a global lockout.
        for (let i = 0; i < 101; i++)
          await authLimit(action, `other-identity-${i}`);
      } finally {
        now.mockRestore();
      }
    },
  );
  it("enforces an atomic limit across concurrent requests without storing identifiers", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        rateLimit("test", "private@example.com", 3, 3600),
      ),
    );
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(3);
    expect(await RateLimit.countDocuments()).toBe(1);
    expect(JSON.stringify(await RateLimit.find().lean())).not.toContain(
      "private@example.com",
    );
    const rejected = results.find((result) => result.status === "rejected");
    if (rejected?.status === "rejected")
      expect(rejected.reason).toMatchObject({ status: 429 });
  });
});
