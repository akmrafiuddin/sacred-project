import { createError, H3Error } from "h3";
import type { ApiErrorResponse } from "../../shared/types";

export function createApiError(
  statusCode: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>
): H3Error {
  const data: ApiErrorResponse = {
    code,
    message,
    fieldErrors,
  };

  return createError({
    statusCode,
    statusMessage: message,
    data,
  });
}
