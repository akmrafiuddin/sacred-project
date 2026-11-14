export default defineNuxtConfig({
  compatibilityDate: "2026-11-01",
  devtools: { enabled: false },
  spaLoadingTemplate: false,
  ssr: true,
  routeRules: {
    "/admin/**": { ssr: false },
    "/account/**": { ssr: false },
  },
  modules: ["nitro-cloudflare-dev"],
  build: { transpile: ["trpc-nuxt"] },
  nitro: {
    preset: "cloudflare_module",
    cloudflare: { nodeCompat: true },
  },
});
