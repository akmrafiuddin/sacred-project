<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppNavbar from "./components/AppNavbar.vue";
import AppFooter from "./components/AppFooter.vue";

const route = useRoute();
const isAdminRoute = computed(() => route.path.startsWith("/admin"));

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - Golpahar Mohashoshan Kali Mandir` : "Golpahar Mohashoshan Kali Mandir";
  },
  meta: [
    { name: "description", content: "Golpahar Mohashoshan Kali Mandir - Daily Darshan, Puja, Rituals, Festivals, and Sacred Heritage" },
    { name: "theme-color", content: "#6E0516" },
  ],
  link: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
    },
  ],
  script: [
    {
      // Anti-flash theme initialization script (Defaults to Palette A: Sindoor & Gold)
      innerHTML: `(function(){
        try {
          var t = localStorage.getItem('temple_theme');
          var isDark = t ? t === 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
          var theme = isDark ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', theme);
          document.documentElement.classList.remove('dark', 'light');
          document.documentElement.classList.add(theme);
        } catch(e) {}
      })();`,
    },
  ],
});
</script>

<template>
  <div class="app-layout" :class="{ 'is-admin-route': isAdminRoute }">
    <!-- Top public navigation bar (hidden on admin routes) -->
    <AppNavbar v-if="!isAdminRoute" />

    <main class="app-main" :class="{ 'admin-main': isAdminRoute }">
      <NuxtPage />
    </main>

    <!-- Site Footer (hidden on admin routes) -->
    <AppFooter v-if="!isAdminRoute" />
  </div>
</template>

<style>
/* --------------------------------------------------------------------------
   TEMPLE COLOR SYSTEM (COLOR_PALETTE.md)
   Palette A: Sindoor & Gold (Light - Primary Default)
   Palette B: Midnight & Hibiscus (Dark - Optional Alternative)
   Follows 60-30-10 Rule & WCAG AA Contrast Standards
-------------------------------------------------------------------------- */

:root,
html[data-theme="light"],
html.light {
  /* Semantic Tokens per Section 4 */
  --color-bg: #F7EFE0;
  --color-surface: #F2DFB4;
  --color-brand: #6E0516;
  --color-brand-deep: #3F0A12;
  --color-accent: #E0A526;
  --color-text: #2B1A17;
  --color-on-brand: #F7EFE0;

  /* Explicit Palette A Color Tokens */
  --cream: #F7EFE0;
  --sand: #F2DFB4;
  --maroon: #6E0516;
  --maroon-deep: #3F0A12;
  --gold: #E0A526;
  --ink: #2B1A17;

  /* UI System Variables (Palette A) */
  --nav-height: 72px;
  --bg-primary: #F7EFE0;                          /* cream (60% dominant) */
  --bg-secondary: #F2DFB4;                        /* sand (alt surface) */
  --bg-card: #FFFFFF;                             /* white cards on cream */
  --bg-panel: #F2DFB4;                            /* sand section panel */
  --border-color: rgba(224, 165, 38, 0.45);       /* gold at 45% */
  --border-subtle: rgba(110, 5, 22, 0.12);        /* maroon subtle at 12% */
  --text-primary: #2B1A17;                        /* ink (never pure black) */
  --text-secondary: rgba(43, 26, 23, 0.74);       /* ink at 74% */
  --text-muted: rgba(43, 26, 23, 0.56);           /* ink at 56% */
  --accent: #E0A526;                              /* Temple Gold (10%) */
  --accent-light: #EBB644;
  --accent-glow: rgba(224, 165, 38, 0.22);
  --accent-text: #6E0516;                         /* Sindoor Maroon (WCAG AA text emphasis on light surfaces, ~11:1) */
  --brand: #6E0516;                               /* Sindoor Maroon (30%) */
  --brand-deep: #3F0A12;                          /* Dark Maroon */
  --heading-color: #6E0516;                       /* Titles in Sindoor Maroon */

  /* Navbar: maroon bg, cream text, gold active */
  --nav-bg: #6E0516;
  --nav-bg-scrolled: #6E0516;
  --nav-text: #F7EFE0;
  --nav-border: rgba(224, 165, 38, 0.35);
  --nav-hover-bg: #3F0A12;
  --nav-hover-text: #E0A526;
  --nav-active-color: #E0A526;
  --action-btn-bg: rgba(247, 239, 224, 0.12);
  --action-btn-border: rgba(224, 165, 38, 0.35);
  --action-btn-hover: #3F0A12;
  --dropdown-bg: #6E0516;
  --mobile-drawer-bg: #6E0516;
  --mobile-item-bg: rgba(247, 239, 224, 0.08);

  /* Buttons */
  --btn-primary-bg: #6E0516;                      /* maroon */
  --btn-primary-text: #F7EFE0;                    /* cream */
  --btn-primary-hover: #3F0A12;                   /* maroon-deep */
  --btn-cta-bg: #E0A526;                          /* gold */
  --btn-cta-text: #3F0A12;                        /* maroon-deep */
  --btn-cta-hover: #C8911C;

  /* Footer: maroon-deep bg, cream text, gold headings */
  --footer-bg: #3F0A12;
  --footer-text: #F7EFE0;
  --footer-text-muted: rgba(247, 239, 224, 0.72);
  --footer-heading: #E0A526;
  --footer-border: rgba(224, 165, 38, 0.25);

  /* Calendar Selected Day per COLOR_PALETTE.md: maroon-deep bg, gold text */
  --cal-selected-bg: #3F0A12;
  --cal-selected-text: #E0A526;

  /* Kesari Alternative Accent override for /home-2 */
  --kesari: #EA580C;
  --kesari-light: #FB923C;

  /* Fonts */
  --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-serif: 'Cinzel', 'Playfair Display', Georgia, serif;
}

/* --------------------------------------------------------------------------
   PALETTE B: MIDNIGHT & HIBISCUS (Dark - Optional Alternative)
-------------------------------------------------------------------------- */
html[data-theme="dark"],
html.dark {
  /* Semantic Tokens per Section 4 */
  --color-bg: #14101F;
  --color-surface: #241B36;
  --color-brand: #D7263D;
  --color-brand-deep: #0D0A15;
  --color-accent: #E6B34A;
  --color-text: #F3EBDD;
  --color-on-brand: #FFFFFF;

  /* Explicit Palette B Color Tokens */
  --midnight: #14101F;
  --midnight-deep: #0D0A15;
  --indigo: #241B36;
  --dusk: #3A2D52;
  --hibiscus: #D7263D;
  --hibiscus-light: #F0505F;
  --gold: #E6B34A;
  --ivory: #F3EBDD;

  /* UI System Variables (Palette B) */
  --nav-height: 72px;
  --bg-primary: #14101F;                          /* midnight (60% dominant) */
  --bg-secondary: #191426;                        /* deep midnight */
  --bg-card: #241B36;                             /* indigo (30% secondary) */
  --bg-panel: #241B36;                            /* indigo panel */
  --border-color: #3A2D52;                        /* dusk (30% borders) */
  --border-subtle: rgba(58, 45, 82, 0.65);
  --text-primary: #F3EBDD;                        /* ivory */
  --text-secondary: rgba(243, 235, 221, 0.85);   /* ivory at 85% */
  --text-muted: rgba(243, 235, 221, 0.60);       /* ivory at 60% */
  --accent: #D7263D;                              /* hibiscus (10%) */
  --accent-light: #F0505F;                        /* hibiscus-light */
  --accent-glow: rgba(215, 38, 61, 0.25);
  --accent-text: #E6B34A;                         /* Temple Gold (WCAG AA text emphasis on dark surfaces, ~9:1) */
  --brand: #D7263D;                               /* hibiscus */
  --brand-deep: #0D0A15;                          /* midnight-deep */
  --heading-color: #F3EBDD;                       /* ivory */

  /* Navbar: indigo bg, ivory text, dusk bottom border, active link gold */
  --nav-bg: #241B36;
  --nav-bg-scrolled: #241B36;
  --nav-text: #F3EBDD;
  --nav-border: #3A2D52;
  --nav-hover-bg: rgba(58, 45, 82, 0.55);
  --nav-hover-text: #E6B34A;
  --nav-active-color: #E6B34A;
  --action-btn-bg: rgba(58, 45, 82, 0.4);
  --action-btn-border: #3A2D52;
  --action-btn-hover: rgba(58, 45, 82, 0.8);
  --dropdown-bg: #241B36;
  --mobile-drawer-bg: #14101F;
  --mobile-item-bg: rgba(243, 235, 221, 0.04);

  /* Buttons */
  --btn-primary-bg: #D7263D;                      /* hibiscus */
  --btn-primary-text: #FFFFFF;
  --btn-primary-hover: #BF1E33;
  --btn-cta-bg: #E6B34A;                          /* gold */
  --btn-cta-text: #14101F;                        /* midnight */
  --btn-cta-hover: #D4A036;

  /* Footer: midnight-deep bg, ivory text, gold headings */
  --footer-bg: #0D0A15;
  --footer-text: #F3EBDD;
  --footer-text-muted: rgba(243, 235, 221, 0.70);
  --footer-heading: #E6B34A;
  --footer-border: #3A2D52;

  /* Calendar Selected Day per COLOR_PALETTE.md: hibiscus bg, white text */
  --cal-selected-bg: #D7263D;
  --cal-selected-text: #FFFFFF;

  /* Kesari Alternative Accent override for /home-2 */
  --kesari: #EA580C;
  --kesari-light: #FB923C;

  /* Fonts */
  --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-serif: 'Cinzel', 'Playfair Display', Georgia, serif;
}

@media (max-width: 768px) {
  :root,
  html[data-theme="dark"],
  html[data-theme="light"],
  html.dark,
  html.light {
    --nav-height: 64px;
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-sans);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  transition: background-color 0.25s ease, color 0.25s ease;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.app-main {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* --------------------------------------------------------------------------
   GLOBAL DESIGN RULES (COLOR_PALETTE.md Section 5)
-------------------------------------------------------------------------- */
/* Rule 7: Visible focus ring on all interactive elements */
:focus-visible {
  outline: 2px solid var(--accent, #E0A526);
  outline-offset: 2px;
}

/* Headings: Sindoor Maroon in Palette A / Ivory in Palette B */
h1, h2, h3, h4, h5, h6,
.section-title,
.hero-title {
  color: var(--heading-color, var(--text-primary));
}

/* Headings with decorative display font */
.section-title,
.hero-title {
  font-family: var(--font-serif);
  letter-spacing: -0.015em;
}

/* Text Highlights adhering to WCAG AA: Sindoor Maroon in Palette A / Gold in Palette B */
.title-highlight,
.title-highlight-inline {
  color: var(--accent-text);
}


/* Text Selection */
::selection {
  background-color: var(--brand, #6E0516);
  color: #FFFFFF;
}

/* --------------------------------------------------------------------------
   VIEW TRANSITION API: LIQUID DROPLET THEME RIPPLE
-------------------------------------------------------------------------- */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-old(root) {
  z-index: 1;
}

::view-transition-new(root) {
  z-index: 9999;
}

/* Fallback smooth transition for browsers without View Transition API */
body,
.app-layout,
.site-header,
.site-footer {
  transition: background-color 0.4s ease, color 0.3s ease, border-color 0.35s ease;
}
</style>
