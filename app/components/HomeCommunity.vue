<script setup lang="ts">
import { useTempleData } from "~/composables/useTempleData";

const props = withDefaults(
  defineProps<{
    variant?: "classic" | "kesari";
  }>(),
  {
    variant: "classic",
  }
);

const { upcomingFestivals, templeNotices } = useTempleData();
</script>

<template>
  <!-- ================================================================= -->
  <!-- VARIANT 1: CLASSIC (Two-Column Minimalist Feed Layout)             -->
  <!-- ================================================================= -->
  <section
    v-if="variant === 'classic'"
    id="festivals-notices"
    class="community-section"
    aria-label="Upcoming Festivals and Temple Notices"
  >
    <div class="community-layout">
      <!-- COLUMN 1: Upcoming Festivals -->
      <div class="community-col festivals-col">
        <div class="col-header">
          <span class="section-badge">Sacred Calendar</span>
          <h2 class="col-title">Upcoming Festivals</h2>
        </div>

        <div class="item-list">
          <article
            v-for="festival in upcomingFestivals"
            :key="festival.id"
            class="minimal-entry"
          >
            <div class="entry-meta">
              <span class="entry-date">{{ festival.date }}</span>
              <span class="entry-sep">•</span>
              <span class="entry-subtag">{{ festival.tithi }}</span>
            </div>
            <h3 class="entry-title">{{ festival.name }}</h3>
            <p class="entry-desc">{{ festival.description }}</p>
          </article>
        </div>

        <div class="col-action">
          <NuxtLink to="/festivals-and-events" class="text-link-subtle">
            <span>View All Festivals & Events</span>
            <svg class="link-arrow" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </NuxtLink>
        </div>
      </div>

      <!-- COLUMN 2: Temple Notices & News -->
      <div class="community-col notices-col">
        <div class="col-header">
          <span class="section-badge">Announcements</span>
          <h2 class="col-title">Temple Notices</h2>
        </div>

        <div class="item-list">
          <article
            v-for="notice in templeNotices"
            :key="notice.id"
            class="minimal-entry"
          >
            <div class="entry-meta">
              <span class="entry-date">{{ notice.date }}</span>
              <span class="entry-sep">•</span>
              <span class="entry-category">{{ notice.category }}</span>
            </div>
            <h3 class="entry-title">{{ notice.title }}</h3>
            <p class="entry-desc">{{ notice.summary }}</p>
          </article>
        </div>

        <div class="col-action">
          <NuxtLink to="/notice-news" class="text-link-subtle">
            <span>View All Notices & News</span>
            <svg class="link-arrow" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>

  <!-- ================================================================= -->
  <!-- VARIANT 2: KESARI (Architectural Split Date-Badge Feed Layout)    -->
  <!-- ================================================================= -->
  <section
    v-else
    id="alt-community"
    class="alt-section"
    aria-label="Upcoming Festivals and Temple Notices"
  >
    <div class="alt-container">
      <div class="community-split-layout">
        <!-- Left: Upcoming Festivals with Date Badges -->
        <div class="community-panel">
          <div class="panel-head">
            <span class="kesari-badge">Sacred Calendar</span>
            <h2 class="panel-heading">Upcoming Festivals</h2>
          </div>

          <div class="festival-block-list">
            <article
              v-for="festival in upcomingFestivals"
              :key="festival.id"
              class="festival-block"
            >
              <div class="date-badge-box">
                <span class="date-month">{{ festival.month }}</span>
                <span class="date-day">{{ festival.day }}</span>
              </div>
              <div class="festival-info">
                <span class="festival-tithi">{{ festival.tithi }}</span>
                <h3 class="festival-name">{{ festival.name }}</h3>
                <p class="festival-desc">{{ festival.description }}</p>
              </div>
            </article>
          </div>

          <NuxtLink to="/festivals-and-events" class="link-kesari">
            <span>View All Festivals & Events</span>
            <svg viewBox="0 0 20 20" fill="currentColor" class="link-icon">
              <path
                fill-rule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </NuxtLink>
        </div>

        <!-- Right: Temple Notice Feed -->
        <div class="community-panel">
          <div class="panel-head">
            <span class="kesari-badge">Official Feed</span>
            <h2 class="panel-heading">Temple Notices</h2>
          </div>

          <div class="notice-feed-list">
            <article
              v-for="notice in templeNotices"
              :key="notice.id"
              class="notice-feed-item"
            >
              <div class="notice-meta-bar">
                <span class="notice-cat-badge">{{ notice.category }}</span>
                <span class="notice-date-str">{{ notice.date }}</span>
              </div>
              <h3 class="notice-head">{{ notice.title }}</h3>
              <p class="notice-body">{{ notice.summary }}</p>
            </article>
          </div>

          <NuxtLink to="/notice-news" class="link-kesari">
            <span>View All Notices & News</span>
            <svg viewBox="0 0 20 20" fill="currentColor" class="link-icon">
              <path
                fill-rule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ----------------------------------------------------
   CLASSIC COMMUNITY STYLES (Layout 1)
---------------------------------------------------- */
.community-section {
  width: 100%;
  padding: 6.5rem 1.5rem;
  background-color: var(--bg-primary);
  position: relative;
}

.community-layout {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 3.5rem;
}

@media (min-width: 860px) {
  .community-layout {
    grid-template-columns: 1fr 1fr;
    gap: 4.5rem;
  }
}

.community-col {
  display: flex;
  flex-direction: column;
}

.col-header {
  margin-bottom: 2.25rem;
}

.section-badge {
  display: inline-block;
  padding: 0.35rem 0.95rem;
  font-size: 0.775rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gold, #E0A526);
  background: var(--nav-hover-bg);
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  margin-bottom: 1rem;
}

.col-title {
  font-size: clamp(1.6rem, 2.5vw, 2.15rem);
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin: 0;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.minimal-entry {
  padding-bottom: 1.75rem;
  border-bottom: 1px solid var(--border-color);
}

.minimal-entry:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.entry-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.45rem;
}

.entry-date {
  color: var(--accent-text);
}

.entry-sep {
  color: var(--border-color);
}

.entry-subtag,
.entry-category {
  color: var(--text-muted);
}

.entry-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.4rem;
  letter-spacing: -0.01em;
}

.entry-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.55;
  margin: 0;
}

.col-action {
  margin-top: 2.5rem;
}

.text-link-subtle {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.925rem;
  font-weight: 700;
  color: var(--text-primary);
  text-decoration: none;
  transition: color 0.15s ease;
}

.text-link-subtle:hover {
  color: var(--accent-text);
}

.link-arrow {
  width: 17px;
  height: 17px;
  transition: transform 0.2s ease;
}

.text-link-subtle:hover .link-arrow,
.link-kesari:hover .link-icon {
  transform: translateX(3px);
}

/* ----------------------------------------------------
   KESARI COMMUNITY STYLES (Layout 2)
---------------------------------------------------- */
@media (max-width: 640px) {
  .community-section,
  .alt-section {
    padding: 4rem 1.25rem;
  }

  .community-layout,
  .community-split-layout {
    gap: 2.75rem;
  }

  .col-header,
  .panel-head {
    margin-bottom: 1.5rem;
  }

  .festival-block {
    padding: 1.15rem 1rem;
    gap: 1rem;
  }
}

.alt-section {
  width: 100%;
  background-color: var(--bg-primary);
  padding: 6.5rem 2rem;
  position: relative;
}

.alt-container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.community-split-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3.5rem;
}

@media (min-width: 900px) {
  .community-split-layout {
    grid-template-columns: 1.05fr 0.95fr;
    gap: 4rem;
  }
}

.community-panel {
  display: flex;
  flex-direction: column;
}

.panel-head {
  margin-bottom: 2.25rem;
}

.kesari-badge {
  display: inline-block;
  padding: 0.35rem 0.9rem;
  font-size: 0.775rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--kesari, #ea580c);
  background: rgba(234, 88, 12, 0.08);
  border: 1px solid rgba(234, 88, 12, 0.3);
  border-radius: 9999px;
  margin-bottom: 1rem;
}

.panel-heading {
  font-size: clamp(1.6rem, 2.6vw, 2.15rem);
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.festival-block-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 2.25rem;
}

.festival-block {
  display: flex;
  gap: 1.35rem;
  padding: 1.35rem 1.4rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.festival-block:hover {
  transform: translateY(-2px);
  border-color: var(--kesari, #ea580c);
}

.date-badge-box {
  width: 58px;
  height: 58px;
  background: rgba(234, 88, 12, 0.1);
  border: 1px solid rgba(234, 88, 12, 0.3);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.date-month {
  font-size: 0.675rem;
  font-weight: 800;
  color: var(--kesari, #ea580c);
  text-transform: uppercase;
}

.date-day {
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--text-primary);
  line-height: 1;
}

.festival-info {
  flex: 1;
}

.festival-tithi {
  font-size: 0.775rem;
  font-weight: 700;
  color: var(--kesari-light, #fb923c);
  display: block;
  margin-bottom: 0.2rem;
}

.festival-name {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 0.35rem;
}

.festival-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.55;
  margin: 0;
}

/* Notice Feed */
.notice-feed-list {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  margin-bottom: 2.25rem;
}

.notice-feed-item {
  padding: 1.35rem 1.4rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.notice-feed-item:hover {
  transform: translateY(-2px);
  border-color: var(--kesari, #ea580c);
}

.notice-meta-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.notice-cat-badge {
  font-size: 0.725rem;
  font-weight: 800;
  color: var(--kesari, #ea580c);
  background: var(--action-btn-bg);
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.notice-date-str {
  font-size: 0.775rem;
  color: var(--text-muted);
}

.notice-head {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 0.35rem;
}

.notice-body {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.55;
  margin: 0;
}

.link-kesari {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.925rem;
  font-weight: 700;
  color: var(--kesari, #ea580c);
  text-decoration: none;
  margin-top: auto;
}

.link-icon {
  width: 17px;
  height: 17px;
}
</style>
