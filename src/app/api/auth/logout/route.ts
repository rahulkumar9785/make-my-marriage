import { z } from "zod";
import { cookies } from "next/headers";
import { body, endpoint } from "@/lib/server/http";
import { database } from "@/lib/server/db";
import { Session } from "@/lib/server/models";
import { COOKIE_NAME, cookieOptions, tokenHash } from "@/lib/server/security";

export const POST = endpoint(async (request) => {
  await body(request, z.object({}).strict());
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await database();
    await Session.deleteOne({ tokenHash: tokenHash(`session:${token}`) });
  }
  store.set(COOKIE_NAME, "", { ...cookieOptions(), maxAge: 0 });
  return Response.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
});
