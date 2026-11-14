import { getDb } from "../../../../db";
import { VisitationsService } from "../../../../services/visitations";
import { requireSession } from "../../../../utils/session";
import { createApiError } from "../../../../utils/errors";

export default defineEventHandler(async (event) => {
  const ref = getRouterParam(event, "ref");
  if (!ref) {
    throw createApiError(400, "BAD_REQUEST", "Visitation reference code is required");
  }

  // Requires authentication
  const { user } = await requireSession(event);
  const db = getDb(event);

  try {
    const outcome = await VisitationsService.cancelUserVisitation(db, ref, user.id);
    return outcome;
  } catch (err: any) {
    throw createApiError(
      400,
      "CANCELLATION_FAILED",
      err?.message || "Could not cancel visitation pass"
    );
  }
});
