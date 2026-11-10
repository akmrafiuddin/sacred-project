<script setup lang="ts">
useHead({
  title: "Home (Alternative Design) - Golpahar Mohashoshan Kali Mandir",
  meta: [
    {
      name: "description",
      content:
        "A place of prayer, peace and community. Dedicated to divine worship, spiritual awakening, and selfless social welfare in Chittagong.",
    },
  ],
});
</script>

<template>
  <div class="home-alt-theme">
    <!-- 1. HERO SECTION (Split-Screen Saffron Kesari Aura) -->
    <HomeHero variant="kesari" />

    <!-- 2. DAILY SCHEDULE (Horizontal Panoramic Stepper Flow) -->
    <HomeSchedule variant="kesari" />

    <!-- 3. PUJA OFFERINGS (2x2 Architectural Quad-Grid) -->
    <HomePujas variant="kesari" />

    <!-- 4. CALENDAR & ARTHI SCHEDULE (Mini Month Calendar + Arthi Schedule) -->
    <CalendarAartiSection variant="kesari" />

    <!-- 5. DEITIES SECTION (Interactive Tabbed Stage Showcase) -->
    <HomeDeities variant="kesari" />

    <!-- 6. FESTIVALS & NOTICES (Split Date-Badge Feed) -->
    <HomeCommunity variant="kesari" />

    <!-- 7. DONATION / SEVA (Wide Architectural Banner - Above Footer) -->
    <HomeDonation variant="kesari" />

    <!-- Floating Demo Switcher for easy toggling between designs -->
    <aside class="demo-switcher" aria-label="Demo Layout Switcher">
      <NuxtLink to="/" class="switcher-pill">
        <span class="switcher-dot"></span>
        <span>View Layout 1 (Golden Classic)</span>
      </NuxtLink>
    </aside>
  </div>
</template>

<style scoped>
.home-alt-theme {
  --kesari: #ea580c;
  --kesari-light: #fb923c;
  --kesari-dark: #c2410c;
  --kesari-glow: rgba(234, 88, 12, 0.22);
  --kesari-subtle: rgba(234, 88, 12, 0.08);
  --accent: #ea580c;
  --accent-light: #fb923c;
  --accent-text: #c2410c;

  width: 100%;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

html[data-theme="dark"] .home-alt-theme {
  --accent-text: #fb923c;
  --kesari: #f97316;
  --kesari-light: #fdba74;
}

/* Floating Demo Switcher */
.demo-switcher {
  position: fixed;
  bottom: 1.75rem;
  right: 1.75rem;
  z-index: 999;
}

.switcher-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 1.15rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  text-decoration: none;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.2s ease;
}

.switcher-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--gold, #E0A526); /* Golden dot representing layout 1 */
}

.switcher-pill:hover {
  transform: translateY(-2px);
  border-color: #ea580c;
  box-shadow: 0 14px 34px rgba(234, 88, 12, 0.25);
}

@media (max-width: 640px) {
  .demo-switcher {
    bottom: 1rem;
    right: 1rem;
  }

  .switcher-pill {
    padding: 0.5rem 0.9rem;
    font-size: 0.775rem;
  }
}
</style>
