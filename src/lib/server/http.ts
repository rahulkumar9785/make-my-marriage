import "server-only";
import { z } from "zod";
import { config } from "./config";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string[]>,
    public retryAfter?: number,
  ) {
    super(message);
  }
}
export function isDuplicate(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}
export function json(data: unknown, status = 200) {
  return Response.json(
    { data },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
export function endpoint(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof ApiError)
        return Response.json(
          {
            error: {
              code: error.code,
              message: error.message,
              ...(error.fields ? { fields: error.fields } : {}),
            },
          },
          {
            status: error.status,
            headers: {
              "Cache-Control": "no-store",
              ...(error.retryAfter
                ? { "Retry-After": String(error.retryAfter) }
                : {}),
            },
          },
        );
      // Never log request bodies, provider errors, connection strings, or tokens.
      console.error(
        "Request failed:",
        error instanceof Error ? error.name : "UnknownError",
      );
      return Response.json(
        {
          error: {
            code: "SERVICE_UNAVAILABLE",
            message:
              "We couldn’t complete that request. Please try again shortly.",
          },
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
  };
}
export async function body<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  if (request.headers.get("origin") !== config().origin)
    throw new ApiError(
      403,
      "INVALID_ORIGIN",
      "Please submit this form from this website.",
    );
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    throw new ApiError(415, "INVALID_CONTENT_TYPE", "Send a JSON request.");
  // Bound actual streamed bytes, not only the client-supplied Content-Length.
  const reader = request.body?.getReader();
  if (!reader)
    throw new ApiError(400, "INVALID_JSON", "A request body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        throw new ApiError(413, "BODY_TOO_LARGE", "This request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let input: unknown;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Send valid JSON.");
  }
  const result = schema.safeParse(input);
  if (!result.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "form";
      (fields[key] ??= []).push(issue.message);
    }
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Please check the highlighted fields.",
      fields,
    );
  }
  return result.data;
}
