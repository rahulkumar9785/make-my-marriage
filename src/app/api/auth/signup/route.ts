import { cookies } from "next/headers";
import { signupSchema } from "@/lib/validation";
import { body, endpoint, json } from "@/lib/server/http";
import { signup } from "@/lib/server/accounts";
import { authLimit } from "@/lib/server/rate-limit";
import { COOKIE_NAME, cookieOptions } from "@/lib/server/security";

export const POST = endpoint(async (request) => {
  const input = await body(request, signupSchema);
  await authLimit("signup", input.email);
  const { token, ...data } = await signup(input);
  (await cookies()).set(COOKIE_NAME, token, cookieOptions());
  return json(data, 201);
});
