import type { H3Event } from "h3";
import type { Role } from "../../shared/types";
import { getAuth } from "./auth";
import { createApiError } from "./errors";

export interface TempleUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: Role;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TempleSession {
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId: string;
}

export interface TempleAuthContext {
  user: TempleUser;
  session: TempleSession;
}

export async function getAuthSession(event: H3Event): Promise<TempleAuthContext | null> {
  // Check cached session on event context
  if ((event.context as any)._session !== undefined) {
    return (event.context as any)._session;
  }

  try {
    const auth = getAuth(event);
    const req = toWebRequest(event);
    const sessionData = await auth.api.getSession({
      headers: req.headers,
    });

    if (!sessionData || !sessionData.user) {
      (event.context as any)._session = null;
      return null;
    }

    const authContext: TempleAuthContext = {
      user: sessionData.user as unknown as TempleUser,
      session: sessionData.session as unknown as TempleSession,
    };

    (event.context as any)._session = authContext;
    return authContext;
  } catch (error) {
    (event.context as any)._session = null;
    return null;
  }
}

export async function requireSession(event: H3Event): Promise<TempleAuthContext> {
  const authContext = await getAuthSession(event);
  if (!authContext) {
    throw createApiError(401, "UNAUTHORIZED", "Authentication required to access this resource");
  }
  return authContext;
}

export async function requireRole(
  event: H3Event,
  allowedRoles: Role[]
): Promise<TempleAuthContext> {
  const authContext = await requireSession(event);
  const userRole = authContext.user.role as Role;

  if (!allowedRoles.includes(userRole)) {
    throw createApiError(
      403,
      "FORBIDDEN",
      `Forbidden: role '${userRole}' does not have permission. Required: [${allowedRoles.join(", ")}]`
    );
  }

  return authContext;
}
