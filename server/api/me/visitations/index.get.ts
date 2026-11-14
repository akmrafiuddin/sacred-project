import { getDb } from "../../../db";
import { VisitationsService } from "../../../services/visitations";
import { requireSession } from "../../../utils/session";

export default defineEventHandler(async (event) => {
  // Requires authentication
  const { user } = await requireSession(event);
  const db = getDb(event);

  // Filter strictly in SQL query by user.id
  const visitations = await VisitationsService.listUserVisitations(db, user.id);
  return { visitations };
});
