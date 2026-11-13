import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { config } from "./config";

export const SESSION_SECONDS = 30 * 24 * 60 * 60;
export const COOKIE_NAME = "mmm_session";
export const newToken = () => randomBytes(32).toString("hex");
export const tokenHash = (value: string) =>
  createHmac("sha256", config().AUTH_SECRET).update(value).digest("hex");
export const hashPassword = (password: string) => bcrypt.hash(password, 12);
// Precomputed cost-12 hash: unknown users still perform a password comparison.
const dummyHash =
  "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";
export async function verifyPassword(password: string, hash = dummyHash) {
  const valid = await bcrypt.compare(password, hash);
  return valid && Buffer.byteLength(password, "utf8") <= 72;
}
export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_SECONDS,
});
