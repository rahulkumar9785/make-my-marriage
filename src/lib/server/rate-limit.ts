import "server-only";
import { database } from "./db";
import { RateLimit } from "./models";
import { tokenHash } from "./security";
import { ApiError, isDuplicate } from "./http";

export async function rateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
) {
  await database();
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = tokenHash(`rate:${scope}:${identifier}:${window}`);
  const expiresAt = new Date((window + 1) * windowSeconds * 1000);
  const update = () =>
    RateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, returnDocument: "after" },
    );
  let counter;
  try {
    counter = await update();
  } catch (error) {
    if (!isDuplicate(error)) throw error;
    counter = await update();
  }
  if (!counter || counter.count > limit)
    throw new ApiError(
      429,
      "RATE_LIMITED",
      "Too many attempts. Please wait before trying again.",
      undefined,
      Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)),
    );
}
export async function authLimit(
  action: "signup" | "login" | "forgot" | "reset",
  identifier: string,
) {
  const seconds = action === "login" ? 60 : 3600;
  await rateLimit(`${action}:global`, "global", 100, seconds);
  await rateLimit(
    action,
    identifier,
    { signup: 5, login: 10, forgot: 3, reset: 10 }[action],
    seconds,
  );
}
