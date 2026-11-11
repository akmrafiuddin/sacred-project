<script setup lang="ts">
useHead({
  title: "Home (Optimized Fast) - Golpahar Mohashoshan Kali Mandir",
  meta: [
    {
      name: "description",
      content:
        "A place of prayer, peace and community. Dedicated to divine worship, spiritual awakening, and selfless social welfare in Chittagong.",
    },
  ],
  link: [
    // Preconnect to Google Fonts domains
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    // Preload only the 3 essential weights: Cinzel:700 & Plus Jakarta Sans:400,600,700 (saves 6 redundant weights)
    {
      rel: "preload",
      as: "style",
      href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap",
    },
    // Asynchronous non-blocking font stylesheet (eliminates FCP render-blocking)
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap",
      media: "print",
      onload: "this.media='all'",
    },
  ],
  noscript: [
    {
      innerHTML:
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" />',
    },
  ],
});
</script>

<template>
  <div class="home-page-container">
    <!-- Top Fast Optimization Banner -->
    <div class="fast-indicator-bar" role="status">
      <span class="fast-badge">⚡ FAST OPTIMIZED</span>
      <span class="fast-text">
        Compressed web assets (77% smaller), non-blocking fonts & instant in-memory SSR hydration
      </span>
      <NuxtLink to="/" class="fast-toggle-link">Switch to Original &rarr;</NuxtLink>
    </div>

    <!-- 1. HERO SECTION (Golden Classic - Fast) -->
    <HomeHeroFast variant="classic" />

    <!-- 2. DAILY SCHEDULE (Vertical Chronological Timeline) -->
    <HomeSchedule variant="classic" />

    <!-- 3. PUJA OFFERINGS (Linear Row List) -->
    <HomePujas variant="classic" />

    <!-- 4. CALENDAR & ARTHI SCHEDULE (Mini Month Calendar + Arthi Schedule) -->
    <CalendarAartiSection variant="default" />

    <!-- 5. DEITIES SECTION (Interactive Carousel Slider - 82KB WebP/Optimized Images) -->
    <HomeDeitiesFast variant="classic" />

    <!-- 6. FESTIVALS & NOTICES (Two-Column Feed) -->
    <HomeCommunity variant="classic" />

    <!-- 7. DONATION / SEVA (Centered Card - Above Footer) -->
    <HomeDonation variant="classic" />

    <!-- Floating Layout & Performance Switcher -->
    <aside class="demo-switcher" aria-label="Demo Layout Switcher">
      <div class="switcher-group">
        <NuxtLink to="/" class="switcher-pill pill-standard" title="View standard uncompressed version">
          <span class="switcher-dot standard-dot"></span>
          <span>View Original (Standard)</span>
        </NuxtLink>
        <NuxtLink to="/home-2" class="switcher-pill pill-kesari" title="View Kesari Saffron layout">
          <span class="switcher-dot kesari-dot"></span>
          <span>View Layout 2 (Kesari)</span>
        </NuxtLink>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.home-page-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* Fast Indicator Bar */
.fast-indicator-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.45rem 1rem;
  background: #0f172a;
  color: #f8fafc;
  font-size: 0.8rem;
  font-weight: 500;
  text-align: center;
  flex-wrap: wrap;
}

.fast-badge {
  background: #10b981;
  color: #022c22;
  font-size: 0.675rem;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  letter-spacing: 0.05em;
}

.fast-text {
  color: #cbd5e1;
}

.fast-toggle-link {
  color: #fbbf24;
  font-weight: 700;
  text-decoration: underline;
  transition: opacity 0.15s ease;
}

.fast-toggle-link:hover {
  opacity: 0.85;
}

/* Floating Demo Switcher */
.demo-switcher {
  position: fixed;
  bottom: 1.75rem;
  right: 1.75rem;
  z-index: 999;
}

.switcher-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.switcher-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  font-size: 0.825rem;
  font-weight: 700;
  color: var(--text-primary);
  text-decoration: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.2s ease;
}

.switcher-pill:hover {
  transform: translateY(-2px);
  border-color: var(--gold, #E0A526);
  box-shadow: 0 12px 28px var(--accent-glow);
}

.switcher-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.switcher-dot.standard-dot {
  background-color: var(--maroon, #6E0516);
}

.switcher-dot.kesari-dot {
  background-color: var(--kesari, #ea580c);
}

@media (max-width: 640px) {
  .fast-indicator-bar {
    font-size: 0.725rem;
    padding: 0.35rem 0.75rem;
  }

  .demo-switcher {
    bottom: 1rem;
    right: 1rem;
  }

  .switcher-pill {
    padding: 0.45rem 0.8rem;
    font-size: 0.75rem;
  }
}
</style>
