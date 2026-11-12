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
  </div>
</template>

<style scoped>
.home-page-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>
