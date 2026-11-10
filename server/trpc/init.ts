import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import type { Role } from "../../shared/types";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware to require authentication (any role: admin, editor, user)
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      session: ctx.session,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

// Middleware to enforce specific roles
function enforceRole(allowedRoles: Role[]) {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.user || !ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required to access this resource",
      });
    }

    const userRole = ctx.user.role as Role;
    if (!allowedRoles.includes(userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Forbidden: role '${userRole}' is not allowed here. Required: [${allowedRoles.join(", ")}]`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        session: ctx.session,
      },
    });
  });
}

// Staff procedure: admin or editor
export const staffProcedure = t.procedure.use(enforceRole(["admin", "editor"]));

// Admin procedure: admin only
export const adminProcedure = t.procedure.use(enforceRole(["admin"]));
