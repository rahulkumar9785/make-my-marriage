import "server-only";
import type { z } from "zod";
import { weddingSchema } from "../validation";
import { database } from "./db";
import { Membership, Wedding } from "./models";
import { ApiError, isDuplicate } from "./http";
import { newToken, tokenHash } from "./security";

export async function createWedding(
  userId: string,
  input: z.infer<typeof weddingSchema>,
) {
  const db = await database();
  try {
    return await db.connection.transaction(async (session) => {
      if (await Membership.exists({ userId }).session(session))
        throw new ApiError(
          409,
          "ALREADY_HAS_WEDDING",
          "Your wedding is already set up. Open your dashboard.",
        );
      const slugBase =
        `${input.brideName}-${input.groomName}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 80) || "celebration";
      const [wedding] = await Wedding.create(
        [
          {
            ...input,
            title: input.title || `${input.brideName} & ${input.groomName}`,
            createdByUserId: userId,
            website: {
              slug: `${slugBase}-${newToken().slice(0, 16)}`,
              isPublished: false,
              theme: "classic",
            },
            gallery: {
              tokenHash: tokenHash(`gallery:${newToken()}`),
              isEnabled: false,
              guestUploadsEnabled: false,
            },
          },
        ],
        { session },
      );
      await Membership.create(
        [{ userId, weddingId: wedding._id, role: "ADMIN" }],
        { session },
      );
      return {
        id: String(wedding._id),
        brideName: wedding.brideName,
        groomName: wedding.groomName,
        weddingDate: wedding.weddingDate,
        website: { slug: wedding.website!.slug },
      };
    });
  } catch (error) {
    if (isDuplicate(error))
      throw new ApiError(
        409,
        "ALREADY_HAS_WEDDING",
        "Your wedding is already set up. Open your dashboard.",
      );
    throw error;
  }
}
