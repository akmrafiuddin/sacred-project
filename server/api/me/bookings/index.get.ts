import { getDb } from "../../../db";
import { BookingsService } from "../../../services/bookings";
import { requireSession } from "../../../utils/session";

export default defineEventHandler(async (event) => {
  // Requires authentication
  const { user } = await requireSession(event);
  const db = getDb(event);

  // Filter strictly in SQL query by user.id
  const bookings = await BookingsService.getUserBookings(db, user.id);
  return { bookings };
});
