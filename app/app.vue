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

  /* Light Theme Specific Tokens & Palette Mappings */
  --bg-main: #F7EFE0;                             /* Primary canvas background */
  --bg-hover: #FAF3E8;                            /* Subtle hover state for cards & buttons */
  --accent-gold: #D4AF37;                         /* Gold accent */
  --accent-green: #15803D;                        /* Accessible green for light surfaces */
  --accent-red: #DC2626;                          /* Accessible red for light surfaces */
  --accent-blue: #2563EB;                         /* Accessible blue for light surfaces */
  --color-live: #15803D;                          /* Live status indicator */

  /* Fonts */
  --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-serif: 'Cinzel', 'Playfair Display', Georgia, serif;
}

/* --------------------------------------------------------------------------
   DARK MODE COLOR PALETTE (Slate / Blue-Grey Modern Architecture)
   Exact Tokens & Hierarchy per Dark Mode Implementation Guide
-------------------------------------------------------------------------- */
html[data-theme="dark"],
html.dark {
  /* Exact Tokens */
  --bg-main: #21262D;            /* Primary canvas background */
  --bg-panel: #161B22;           /* Sidebars, distinct panels, right/left columns */
  --bg-card: #1C2128;            /* Individual items, team boxes, list items */
  --bg-hover: #252B33;           /* Hover states for cards and buttons */

  --text-primary: #FFFFFF;       /* Headings, names, primary data, active states */
  --text-secondary: #8B949E;     /* Labels, dates, metadata, inactive text */

  --border-subtle: #30363D;      /* Section dividers, card outlines */

  --accent-gold: #D4AF37;        /* Primary highlights, winner paths, active indicators */
  --accent-green: #4ADE80;       /* Live status, positive trends, online dots */
  --accent-red: #EF4444;         /* Alerts, specific team branding */
  --accent-blue: #6366F1;        /* Info icons, specific team branding */

  /* Application Rules Mapping */
  --nav-height: 72px;

  /* Main Layout: Apply --bg-main to the primary body/main content area */
  --bg-primary: var(--bg-main);                           /* #21262D */
  --color-bg: var(--bg-main);                             /* #21262D */

  /* Sidebars/Panels: Apply --bg-panel to navigation bars or side widgets */
  --bg-secondary: var(--bg-panel);                        /* #161B22 */
  --bg-panel: #161B22;                                    /* #161B22 */

  /* Cards/Items: Apply --bg-card to individual components */
  --bg-card: #1C2128;                                     /* #1C2128 */
  --color-surface: var(--bg-card);                        /* #1C2128 */
  --action-btn-bg: var(--bg-card);
  --mobile-item-bg: var(--bg-card);

  /* Borders: Avoid heavy borders. Use --border-subtle */
  --border-color: var(--border-subtle);                   /* #30363D */
  --border-subtle: #30363D;                               /* #30363D */

  /* Text Contrast: --text-primary for headings/high-importance, --text-secondary for supporting text */
  --text-primary: #FFFFFF;                                /* #FFFFFF */
  --text-secondary: #8B949E;                              /* #8B949E */
  --text-muted: #8B949E;                                  /* #8B949E */
  --heading-color: var(--text-primary);                   /* #FFFFFF */
  --color-text: var(--text-primary);                      /* #FFFFFF */

  /* Accents & Highlights: Primary Accent --accent-gold for active indicators, primary highlights */
  --accent: var(--accent-gold);                           /* #D4AF37 */
  --accent-light: #E0C158;
  --accent-glow: rgba(212, 175, 55, 0.22);
  --accent-text: var(--accent-gold);                      /* #D4AF37 text highlight */
  --color-accent: var(--accent-gold);                     /* #D4AF37 */
  --brand: var(--accent-gold);
  --color-brand: var(--accent-gold);
  --color-brand-deep: var(--bg-panel);                    /* #161B22 */
  --color-on-brand: #161B22;

  /* Status Indicators: --accent-green for Live status & online dots */
  --color-live: var(--accent-green);                      /* #4ADE80 */

  /* Navbar: Apply --bg-panel, text-primary, active-color accent-gold */
  --nav-bg: var(--bg-panel);                              /* #161B22 */
  --nav-bg-scrolled: var(--bg-panel);                     /* #161B22 */
  --nav-text: var(--text-primary);                        /* #FFFFFF */
  --nav-border: var(--border-subtle);                     /* #30363D */
  --nav-hover-bg: var(--bg-hover);                        /* #252B33 */
  --nav-hover-text: var(--accent-gold);                   /* #D4AF37 */
  --nav-active-color: var(--accent-gold);                 /* #D4AF37 */
  --action-btn-border: var(--border-subtle);              /* #30363D */
  --action-btn-hover: var(--bg-hover);                    /* #252B33 */
  --dropdown-bg: var(--bg-panel);                         /* #161B22 */
  --mobile-drawer-bg: var(--bg-panel);                    /* #161B22 */

  /* Buttons */
  --btn-primary-bg: var(--accent-gold);                   /* #D4AF37 */
  --btn-primary-text: #161B22;
  --btn-primary-hover: #C59F2D;
  --btn-cta-bg: var(--accent-gold);                       /* #D4AF37 */
  --btn-cta-text: #161B22;
  --btn-cta-hover: #C59F2D;

  /* Footer: Apply --bg-panel, text-secondary, heading accent-gold, border-subtle */
  --footer-bg: var(--bg-panel);                           /* #161B22 */
  --footer-text: var(--text-secondary);                   /* #8B949E */
  --footer-text-muted: var(--text-secondary);             /* #8B949E */
  --footer-heading: var(--accent-gold);                   /* #D4AF37 */
  --footer-border: var(--border-subtle);                  /* #30363D */

  /* Calendar / Pickers Selected Day */
  --cal-selected-bg: var(--accent-gold);                  /* #D4AF37 */
  --cal-selected-text: #161B22;

  /* Legacy Aliases for Component Fallbacks */
  --midnight: var(--bg-main);                             /* #21262D */
  --midnight-deep: var(--bg-panel);                       /* #161B22 */
  --indigo: var(--bg-card);                               /* #1C2128 */
  --dusk: var(--border-subtle);                           /* #30363D */
  --hibiscus: var(--accent-red);                          /* #EF4444 */
  --hibiscus-light: #F87171;
  --gold: var(--accent-gold);                             /* #D4AF37 */
  --ivory: var(--text-primary);                           /* #FFFFFF */

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

/* --------------------------------------------------------------------------
   DARK MODE COMPONENT APPLICATION RULES
-------------------------------------------------------------------------- */
/* Sidebars/Panels: Apply --bg-panel to navigation bars */
html[data-theme="dark"] .site-header,
html.dark .site-header {
  background-color: var(--nav-bg);
  border-bottom: 1px solid var(--nav-border);
}

/* Cards/Items: Apply --bg-hover on hover for subtle background shift */
html[data-theme="dark"] .deity-card:hover,
html.dark .deity-card:hover,
html[data-theme="dark"] .puja-card:hover,
html.dark .puja-card:hover,
html[data-theme="dark"] .event-card:hover,
html.dark .event-card:hover,
html[data-theme="dark"] .schedule-card:hover,
html.dark .schedule-card:hover,
html[data-theme="dark"] .category-card:hover,
html.dark .category-card:hover,
html[data-theme="dark"] .hero-slider-card:hover,
html.dark .hero-slider-card:hover,
html[data-theme="dark"] .lookup-card:hover,
html.dark .lookup-card:hover {
  background-color: var(--bg-hover) !important;
  border-color: var(--border-subtle) !important;
}

/* Buttons hover states */
html[data-theme="dark"] .btn-secondary:hover,
html.dark .btn-secondary:hover,
html[data-theme="dark"] .btn-action.secondary:hover,
html.dark .btn-action.secondary:hover,
html[data-theme="dark"] .btn-action.outline:hover,
html.dark .btn-action.outline:hover {
  background-color: var(--bg-hover) !important;
  border-color: var(--border-subtle) !important;
  color: var(--text-primary) !important;
}

/* Status Indicators: strictly --accent-green for Live status & online dots */
html[data-theme="dark"] .live-pulse .pulse-dot,
html.dark .live-pulse .pulse-dot,
html[data-theme="dark"] .beacon-dot,
html.dark .beacon-dot,
html[data-theme="dark"] .status-beacon,
html.dark .status-beacon,
html[data-theme="dark"] .status-circle,
html.dark .status-circle {
  background-color: var(--accent-green) !important;
  box-shadow: 0 0 8px var(--accent-green) !important;
}

html[data-theme="dark"] .live-pulse .pulse-ring,
html.dark .live-pulse .pulse-ring {
  background-color: var(--accent-green) !important;
}
</style>
