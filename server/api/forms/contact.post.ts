import { getDb } from "../../db";
import { MessagesService } from "../../services/messages";
import { contactMessageSubmissionSchema } from "../../../shared/schemas/forms";
import { verifyTurnstile } from "../../utils/turnstile";
import { enforceRateLimit } from "../../utils/rate-limit";
import { createApiError } from "../../utils/errors";

export default defineEventHandler(async (event) => {
  // 1. IP Rate Limiting (5 submissions per 10 mins)
  enforceRateLimit(event, { key: "form:contact", maxRequests: 5, windowSeconds: 600 });

  // 2. Parse & Validate Input
  const body = await readBody(event);
  const parseResult = contactMessageSubmissionSchema.safeParse(body);
  if (!parseResult.success) {
    throw createApiError(
      400,
      "VALIDATION_ERROR",
      "Invalid contact message details",
      parseResult.error.flatten().fieldErrors
    );
  }

  // 3. Verify Cloudflare Turnstile Challenge
  await verifyTurnstile(event, parseResult.data.turnstileToken);

  // 4. Save Message
  const db = getDb(event);
  const result = await MessagesService.createMessage(db, parseResult.data);

  return {
    success: true,
    message: result.message,
    id: result.id,
  };
});
