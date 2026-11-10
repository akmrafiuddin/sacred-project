import { getDb } from "../../db";
import { VolunteersService } from "../../services/volunteers";
import { volunteerSubmissionSchema } from "../../../shared/schemas/forms";
import { verifyTurnstile } from "../../utils/turnstile";
import { enforceRateLimit } from "../../utils/rate-limit";
import { createApiError } from "../../utils/errors";

export default defineEventHandler(async (event) => {
  // 1. IP Rate Limiting (5 submissions per 10 mins)
  enforceRateLimit(event, { key: "form:volunteer", maxRequests: 5, windowSeconds: 600 });

  // 2. Parse & Validate Input
  const body = await readBody(event);
  const parseResult = volunteerSubmissionSchema.safeParse(body);
  if (!parseResult.success) {
    throw createApiError(
      400,
      "VALIDATION_ERROR",
      "Invalid volunteer registration details",
      parseResult.error.flatten().fieldErrors
    );
  }

  // 3. Verify Cloudflare Turnstile Challenge
  await verifyTurnstile(event, parseResult.data.turnstileToken);

  // 4. Register Volunteer
  const db = getDb(event);
  const result = await VolunteersService.createVolunteer(db, parseResult.data);

  return {
    success: true,
    message: result.message,
  };
});
