import { getDb } from "../../../db";
import { VisitationsService } from "../../../services/visitations";
import { createApiError } from "../../../utils/errors";

export default defineEventHandler(async (event) => {
  const ref = getRouterParam(event, "ref");
  if (!ref) {
    throw createApiError(400, "BAD_REQUEST", "Visitation reference code is required");
  }

  const db = getDb(event);
  const pass = await VisitationsService.getByRef(db, ref);
  if (!pass) {
    throw createApiError(404, "NOT_FOUND", `No visitation pass found for reference '${ref}'`);
  }

  return pass;
});
