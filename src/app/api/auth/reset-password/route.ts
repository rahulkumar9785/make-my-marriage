import { cookies } from "next/headers";
import { resetSchema } from "@/lib/validation";
import { body, endpoint } from "@/lib/server/http";
import { resetPassword } from "@/lib/server/accounts";
import { authLimit } from "@/lib/server/rate-limit";
import { COOKIE_NAME, cookieOptions } from "@/lib/server/security";
export const POST = endpoint(async (request) => {
  const input = await body(request, resetSchema);
  await authLimit("reset", input.token);
  await resetPassword(input.token, input.password);
  (await cookies()).set(COOKIE_NAME, "", { ...cookieOptions(), maxAge: 0 });
  return Response.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
});
