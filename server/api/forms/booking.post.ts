import { getDb } from "../../db";
import { BookingsService } from "../../services/bookings";
import { pujaBookingSubmissionSchema } from "../../../shared/schemas/forms";
import { verifyTurnstile } from "../../utils/turnstile";
import { enforceRateLimit } from "../../utils/rate-limit";
import { getAuthSession } from "../../utils/session";
import { createApiError } from "../../utils/errors";

export default defineEventHandler(async (event) => {
  // 1. IP Rate Limiting (5 submissions per 10 mins)
  enforceRateLimit(event, { key: "form:booking", maxRequests: 5, windowSeconds: 600 });

  // 2. Parse & Validate Input
  const body = await readBody(event);
  const parseResult = pujaBookingSubmissionSchema.safeParse(body);
  if (!parseResult.success) {
    throw createApiError(
      400,
      "VALIDATION_ERROR",
      "Invalid booking form details",
      parseResult.error.flatten().fieldErrors
    );
  }

  // 3. Verify Cloudflare Turnstile Challenge
  await verifyTurnstile(event, parseResult.data.turnstileToken);

  // 4. Check for logged-in devotee account (optional: guest submissions are allowed)
  const authContext = await getAuthSession(event);
  const userId = authContext?.user.id || null;

  // 5. Create Booking Request
  const db = getDb(event);
  const result = await BookingsService.createBookingRequest(db, parseResult.data, userId);

  return {
    success: true,
    ref: result.ref,
    message: result.message,
  };
});
