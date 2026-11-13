import "server-only";
import { z } from "zod";

const schema = z.object({
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//),
  AUTH_SECRET: z.string().min(32),
  APP_URL: z.url().refine((value) => {
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      (url.protocol === "https:" ||
        (process.env.NODE_ENV !== "production" && url.protocol === "http:"))
    );
  }, "Use an origin such as https://example.com"),
});

export function config() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success)
    throw new Error(
      "Server configuration is incomplete. Check the environment setup.",
    );
  return { ...parsed.data, origin: new URL(parsed.data.APP_URL).origin };
}

export function emailConfig() {
  const result = z
    .object({
      RESEND_API_KEY: z.string().min(1),
      EMAIL_FROM: z.string().min(1),
    })
    .safeParse(process.env);
  if (!result.success) throw new Error("Email configuration is incomplete.");
  return result.data;
}
