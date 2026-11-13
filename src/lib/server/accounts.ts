import "server-only";
import type { z } from "zod";
import { signupSchema, loginSchema } from "../validation";
import { database } from "./db";
import { Session, User, Membership, ResetToken } from "./models";
import { ApiError, isDuplicate } from "./http";
import {
  hashPassword,
  verifyPassword,
  newToken,
  tokenHash,
  SESSION_SECONDS,
} from "./security";
import { config, emailConfig } from "./config";

export async function signup(input: z.infer<typeof signupSchema>) {
  const db = await database();
  const passwordHash = await hashPassword(input.password);
  const token = newToken();
  try {
    const user = await db.connection.transaction(async (transaction) => {
      const [user] = await User.create(
        [
          {
            name: input.name,
            email: input.email,
            emailNormalized: input.email,
            passwordHash,
          },
        ],
        { session: transaction },
      );
      await Session.create(
        [
          {
            userId: user._id,
            tokenHash: tokenHash(`session:${token}`),
            expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000),
          },
        ],
        { session: transaction },
      );
      return user;
    });
    return {
      token,
      user: { id: String(user._id), name: user.name, email: user.email },
      hasWedding: false,
    };
  } catch (error) {
    if (isDuplicate(error))
      throw new ApiError(
        409,
        "EMAIL_ALREADY_EXISTS",
        "An account with this email already exists. Try logging in.",
      );
    throw error;
  }
}
export async function login(input: z.infer<typeof loginSchema>) {
  const db = await database();
  const user = await User.findOne({ emailNormalized: input.email }).select(
    "+passwordHash",
  );
  const valid = await verifyPassword(input.password, user?.passwordHash);
  if (!user || !valid)
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password.",
    );
  const token = newToken();
  await db.connection.transaction(async (transaction) => {
    // Serialize against password resets so a stale password cannot create a session.
    const result = await User.updateOne(
      { _id: user._id, passwordHash: user.passwordHash },
      { $inc: { authVersion: 1 } },
      { session: transaction },
    );
    if (!result.modifiedCount)
      throw new ApiError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid email or password.",
      );
    await Session.create(
      [
        {
          userId: user._id,
          tokenHash: tokenHash(`session:${token}`),
          expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000),
        },
      ],
      { session: transaction },
    );
  });
  const hasWedding = Boolean(await Membership.exists({ userId: user._id }));
  return {
    token,
    user: { id: String(user._id), name: user.name, email: user.email },
    hasWedding,
  };
}
export async function forgotPassword(email: string) {
  await database();
  const mail = emailConfig();
  const user = await User.findOne({ emailNormalized: email });
  if (!user) return;
  const token = newToken();
  const reset = await ResetToken.create({
    userId: user._id,
    tokenHash: tokenHash(`reset:${token}`),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });
  const url = `${config().origin}/reset-password?token=${token}`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mail.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `password-reset/${reset._id}`,
      },
      body: JSON.stringify({
        from: mail.EMAIL_FROM,
        to: [user.email],
        subject: "Reset your Make My Marriage password",
        text: `Use this link to reset your password:\n\n${url}\n\nThis link expires in 30 minutes and works once. If you did not request it, you can ignore this email.`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("EmailDeliveryError");
  } catch {
    await ResetToken.deleteOne({ _id: reset._id });
    throw new ApiError(
      503,
      "EMAIL_UNAVAILABLE",
      "Password recovery is temporarily unavailable. Please try again shortly.",
    );
  }
}
export async function resetPassword(token: string, password: string) {
  const db = await database();
  const passwordHash = await hashPassword(password);
  await db.connection.transaction(async (transaction) => {
    const reset = await ResetToken.findOneAndDelete(
      {
        tokenHash: tokenHash(`reset:${token}`),
        expiresAt: { $gt: new Date() },
      },
      { session: transaction },
    );
    if (!reset)
      throw new ApiError(
        400,
        "INVALID_TOKEN",
        "This reset link is invalid or has expired. Request a new one.",
      );
    const user = await User.updateOne(
      { _id: reset.userId },
      { $set: { passwordHash }, $inc: { authVersion: 1 } },
      { session: transaction },
    );
    if (!user.matchedCount)
      throw new ApiError(
        400,
        "INVALID_TOKEN",
        "This reset link is invalid or has expired. Request a new one.",
      );
    await Session.deleteMany(
      { userId: reset.userId },
      { session: transaction },
    );
    await ResetToken.deleteMany(
      { userId: reset.userId },
      { session: transaction },
    );
  });
}
