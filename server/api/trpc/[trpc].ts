import { createTRPCNuxtHandler } from "trpc-nuxt/server";
import { appRouter } from "../../trpc/routers";
import { createContext } from "../../trpc/context";

export default createTRPCNuxtHandler({
  router: appRouter,
  createContext,
});
