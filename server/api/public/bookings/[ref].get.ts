import { getDb } from "../../../db";
import { BookingsService } from "../../../services/bookings";
import { createApiError } from "../../../utils/errors";

export default defineEventHandler(async (event) => {
  const ref = getRouterParam(event, "ref");
  if (!ref) {
    throw createApiError(400, "BAD_REQUEST", "Booking reference code is required");
  }

  const db = getDb(event);
  const booking = await BookingsService.getByRef(db, ref);
  if (!booking) {
    throw createApiError(404, "NOT_FOUND", `No booking found for reference '${ref}'`);
  }

  return booking;
});
