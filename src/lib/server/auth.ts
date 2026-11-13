import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { database } from "./db";
import { Membership, Session, User, Wedding } from "./models";
import { COOKIE_NAME, tokenHash } from "./security";
import { ApiError } from "./http";

export async function currentAccount() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  await database();
  const session = await Session.findOne({
    tokenHash: tokenHash(`session:${token}`),
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!session) return null;
  const user = await User.findById(session.userId).lean();
  if (!user) return null;
  const membership = await Membership.findOne({ userId: user._id }).lean();
  const wedding = membership
    ? await Wedding.findOne({
        _id: membership.weddingId,
        deletedAt: null,
      }).lean()
    : null;
  // An inconsistent/deleted membership must never permit creation of another tenant.
  if (membership && !wedding)
    throw new ApiError(
      409,
      "WORKSPACE_UNAVAILABLE",
      "Your wedding workspace is unavailable. Please contact support.",
    );
  return {
    user: { id: String(user._id), name: user.name, email: user.email },
    membership: membership
      ? { id: String(membership._id), role: membership.role }
      : null,
    wedding,
  };
}
export async function requireAccount() {
  const account = await currentAccount();
  if (!account)
    throw new ApiError(401, "UNAUTHORIZED", "Please log in to continue.");
  return account;
}
export async function requirePageAccount() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  return account;
}
export function publicWedding(
  wedding: NonNullable<Awaited<ReturnType<typeof currentAccount>>>["wedding"],
) {
  if (!wedding) return null;
  return {
    id: String(wedding._id),
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    title: wedding.title,
    description: wedding.description,
    weddingDate: wedding.weddingDate,
    timeZone: wedding.timeZone,
    location: wedding.location,
    website: wedding.website,
    gallery: {
      isEnabled: wedding.gallery?.isEnabled ?? false,
      guestUploadsEnabled: wedding.gallery?.guestUploadsEnabled ?? false,
    },
    livestream: wedding.livestream,
  };
}
