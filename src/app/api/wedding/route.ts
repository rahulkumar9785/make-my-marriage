import { weddingSchema } from "@/lib/validation";
import { requireAccount, publicWedding } from "@/lib/server/auth";
import { body, endpoint, json, ApiError } from "@/lib/server/http";
import { createWedding } from "@/lib/server/weddings";
export const GET = endpoint(async () => {
  const account = await requireAccount();
  if (!account.wedding)
    throw new ApiError(
      404,
      "WEDDING_NOT_FOUND",
      "Set up your wedding to get started.",
    );
  return json(publicWedding(account.wedding));
});
export const POST = endpoint(async (request) => {
  const input = await body(request, weddingSchema);
  const account = await requireAccount();
  return json(await createWedding(account.user.id, input), 201);
});
