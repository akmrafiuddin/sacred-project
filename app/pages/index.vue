<script setup lang="ts">
useHead({
  title: "Home - Golpahar Mohashoshan Kali Mandir",
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
  <div class="home-page-container">
    <!-- 1. HERO SECTION (Golden Classic) -->
    <HomeHero variant="classic" />

    <!-- 2. DAILY SCHEDULE (Vertical Chronological Timeline) -->
    <HomeSchedule variant="classic" />

    <!-- 3. PUJA OFFERINGS (Linear Row List) -->
    <HomePujas variant="classic" />

    <!-- 4. CALENDAR & ARTHI SCHEDULE (Mini Month Calendar + Arthi Schedule) -->
    <CalendarAartiSection variant="default" />

    <!-- 5. DEITIES SECTION (Interactive Carousel Slider) -->
    <HomeDeities variant="classic" />

    <!-- 6. FESTIVALS & NOTICES (Two-Column Feed) -->
    <HomeCommunity variant="classic" />

    <!-- 7. DONATION / SEVA (Centered Card - Above Footer) -->
    <HomeDonation variant="classic" />

    <!-- Floating Demo Switcher -->
    <aside class="demo-switcher" aria-label="Demo Layout Switcher">
      <NuxtLink to="/home-2" class="switcher-pill">
        <span class="switcher-dot kesari-dot"></span>
        <span>View Layout 2 (Kesari Saffron)</span>
      </NuxtLink>
    </aside>
  </div>
</template>

<style scoped>
.home-page-container {
  width: 100%;
  display: flex;
  flex-direction: column;
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
  background-color: var(--gold, #E0A526);
}

.switcher-dot.kesari-dot {
  background-color: var(--kesari, #ea580c);
}

.switcher-pill:hover {
  transform: translateY(-2px);
  border-color: var(--gold, #E0A526);
  box-shadow: 0 14px 34px var(--accent-glow);
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
