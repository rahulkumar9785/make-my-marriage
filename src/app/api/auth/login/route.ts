import { cookies } from "next/headers";
import { loginSchema } from "@/lib/validation";
import { body, endpoint, json } from "@/lib/server/http";
import { login } from "@/lib/server/accounts";
import { authLimit } from "@/lib/server/rate-limit";
import { COOKIE_NAME, cookieOptions } from "@/lib/server/security";

export const POST = endpoint(async (request) => {
  const input = await body(request, loginSchema);
  await authLimit("login", input.email);
  const { token, ...data } = await login(input);
  (await cookies()).set(COOKIE_NAME, token, cookieOptions());
  return json(data);
});
