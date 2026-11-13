import { forgotSchema } from "@/lib/validation";
import { ApiError, body, endpoint } from "@/lib/server/http";
import { forgotPassword } from "@/lib/server/accounts";
import { authLimit } from "@/lib/server/rate-limit";
export const POST = endpoint(async (request) => {
  const input = await body(request, forgotSchema);
  await authLimit("forgot", input.email);
  try {
    await forgotPassword(input.email);
  } catch (error) {
    if (!(error instanceof ApiError) || error.code !== "EMAIL_UNAVAILABLE")
      throw error;
    // Delivery failures must not turn this endpoint into an account-existence probe.
    console.warn("Password recovery email delivery unavailable.");
  }
  return Response.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
});
