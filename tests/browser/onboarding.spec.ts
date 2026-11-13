import { test, expect } from "@playwright/test";
import { MongoClient } from "mongodb";
import { createHmac, randomBytes } from "node:crypto";

test("signup, wedding setup, saved dashboard, isolation, logout, and password reset", async ({
  page,
  browser,
}, testInfo) => {
  const email = `aanya-${testInfo.project.name}-${Date.now()}@example.com`;
  const password = "a memorable wedding password";
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("link", { name: "Start Planning", exact: true }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await page.getByLabel("Your name").fill("Aanya");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.screenshot({
    path: testInfo.outputPath("signup.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  const cookies = await page.context().cookies();
  expect(cookies.find((cookie) => cookie.name === "mmm_session")).toMatchObject(
    { httpOnly: true, sameSite: "Lax" },
  );
  await page.getByLabel("Bride’s name").fill("Aanya");
  await page.getByLabel("Groom’s name").fill("Kabir");
  await page.getByLabel("Wedding date", { exact: true }).fill("2027-02-14");
  await page.getByLabel("Wedding location").fill("Royal Pavilion, Jaipur");
  await page.getByRole("button", { name: "Create our wedding" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Aanya & Kabir", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("14 February 2027")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Royal Pavilion, Jaipur")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("dashboard.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const anonymous = await browser.newContext();
  const other = await anonymous.newPage();
  await other.goto(
    `${testInfo.project.use.baseURL || process.env.E2E_BASE_URL}/dashboard`,
  );
  await expect(other).toHaveURL(/\/login$/);
  await anonymous.close();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // Seed only the isolated test database; email delivery is covered by integration tests.
  const db = new MongoClient(process.env.MONGODB_URI!);
  await db.connect();
  const token = randomBytes(32).toString("hex");
  const user = await db
    .db()
    .collection("users")
    .findOne({ emailNormalized: email });
  await db
    .db()
    .collection("password_reset_tokens")
    .insertOne({
      userId: user!._id,
      tokenHash: createHmac("sha256", process.env.AUTH_SECRET!)
        .update(`reset:${token}`)
        .digest("hex"),
      expiresAt: new Date(Date.now() + 60000),
      createdAt: new Date(),
    });
  await db.close();
  await page.goto(`/reset-password?token=${token}`);
  await page
    .getByLabel("New password", { exact: true })
    .fill("a fresh memorable password");
  await page.getByLabel("Confirm password").fill("a fresh memorable password");
  await page
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Your password has been updated",
  );
  await page.getByRole("link", { name: "Back to log in" }).click();
  await page.getByLabel("Email address").fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("a fresh memorable password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(errors).toEqual([]);
});

test("form feedback, missing reset token, generic recovery, and keyboard tabs", async ({
  page,
}) => {
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Ritu");
  await page.getByLabel("Email address").fill("ritu@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("a memorable password");
  await page.getByLabel("Confirm password").fill("a different password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator(".form-message[role=alert]")).toContainText(
    "passwords don’t match",
  );
  await page.goto("/reset-password");
  await expect(page.locator(".form-message[role=alert]")).toContainText(
    "missing or invalid",
  );
  await page.getByRole("link", { name: "Request a new link" }).click();
  await page.getByLabel("Email address").fill("unknown@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("If an account exists");
  await page.goto("/");
  const tab = page.getByRole("tab", { name: "Budget Ledger (INR)" });
  await tab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Events & Timeline" }),
  ).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Your Celebration, in Sequence",
  );
});

test("homepage navigation fits narrow and tablet viewports", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [320, 375, 390, 560, 800, 820, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page
        .locator(".nav-wrap")
        .evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
  }
});
