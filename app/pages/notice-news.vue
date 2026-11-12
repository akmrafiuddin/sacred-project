<script setup lang="ts">
import { ref, computed } from "vue";

interface NoticeDisplayItem {
  id: number | string;
  slug: string;
  title: string;
  category: string;
  date: string;
  body: string;
  pinned: boolean;
}

// Canonical default notices fallback
const defaultNotices: NoticeDisplayItem[] = [
  {
    id: 1,
    slug: "notice-1",
    title: "Special Early Darshan Hours for Ekadashi",
    category: "schedule",
    date: "2026-11-12",
    body: "Temple gates will open at 4:30 AM for early morning abhishekam and special darshan. Devotees are requested to arrive early and maintain peaceful silence in the sanctum corridor.",
    pinned: true,
  },
  {
    id: 2,
    slug: "notice-2",
    title: "Devotee Seva Volunteer Registration Open",
    category: "seva",
    date: "2026-11-18",
    body: "Registration is now open for volunteers to assist in daily Annadanam food distribution, pilgrim crowd coordination, and festival seva during upcoming holy tithis.",
    pinned: false,
  },
  {
    id: 3,
    slug: "notice-3",
    title: "Annadanam Dining Hall Upgrades in Progress",
    category: "facility",
    date: "2026-11-24",
    body: "The Annadanam dining hall is undergoing covered pavilion expansion to accommodate more pilgrims comfortably. Daily prasad distribution continues smoothly in the adjacent courtyard.",
    pinned: false,
  },
  {
    id: 4,
    slug: "notice-4",
    title: "Winter Blanket & Relief Distribution Drive",
    category: "welfare",
    date: "2026-12-02",
    body: "The temple trust is organizing a winter humanitarian relief drive for underprivileged families in greater Chittagong. Devotees wishing to contribute blankets or dry food may contact the temple office.",
    pinned: false,
  },
];

// Fetch notices from public API
const { data: noticesResponse, status: noticesStatus } = await useFetch<{ items: any[] }>(
  "/api/public/notices",
  {
    key: "public_notices_list",
    server: true,
  }
);

// Category filter state
const selectedCategory = ref<string>("all");

// Format and normalize notices
const allNotices = computed<NoticeDisplayItem[]>(() => {
  const items = noticesResponse.value?.items;
  if (Array.isArray(items) && items.length > 0) {
    return items
      .filter((n) => n.active !== false)
      .map((n) => ({
        id: n.id || n.slug,
        slug: n.slug || "",
        title: typeof n.title === "object" ? n.title?.en || n.title?.bn || "Temple Notice" : n.title || "Temple Notice",
        category: (n.category || "general").toLowerCase(),
        date: n.date || "",
        body: typeof n.body === "object" ? n.body?.en || n.body?.bn || "" : n.body || "",
        pinned: Boolean(n.pinned),
      }))
      .sort((a, b) => {
        // Pinned notices first, then newest date
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.date || "").localeCompare(a.date || "");
      });
  }
  return defaultNotices;
});

// Filtered notices
const displayedNotices = computed<NoticeDisplayItem[]>(() => {
  if (selectedCategory.value === "all") {
    return allNotices.value;
  }
  return allNotices.value.filter(
    (n) => n.category.toLowerCase() === selectedCategory.value.toLowerCase()
  );
});

// Format publication date
const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length < 3) return dateStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
};

useHead({
  title: "Temple Notices & News - Golpahar Mohashoshan Kali Mandir",
  meta: [
    {
      name: "description",
      content:
        "Official notice board, darshan schedule adjustments, pilgrim circulars, and community seva announcements from the administration of Golpahar Mohashoshan Kali Mandir, Chittagong.",
    },
    {
      property: "og:title",
      content: "Temple Notices & Bulletins - Golpahar Kali Mandir",
    },
    {
      property: "og:description",
      content:
        "Official updates, pilgrim advisories, and seva circulars from Golpahar Mohashoshan Kali Mandir.",
    },
  ],
});
</script>

<template>
  <div class="notices-page" lang="en">
    <!-- 1. HERO HEADER -->
    <header class="page-hero">
      <div class="hero-inner">
        <span class="hero-badge">Mandir Bulletin &amp; Announcements</span>
        <h1 class="hero-title">Temple Notices &amp; News</h1>
        <p class="hero-subtitle">
          Official circulars, darshan schedule advisories, seva opportunities, and pilgrim guidelines
          published by the Executive Committee of Golpahar Mohashoshan Kali Mandir.
        </p>
        <div class="hero-divider" aria-hidden="true"></div>
      </div>
    </header>

    <main class="page-container">
      <!-- 2. CATEGORY FILTER BAR -->
      <div class="filter-bar">
        <button
          type="button"
          class="filter-tab-btn"
          :class="{ 'tab-active': selectedCategory === 'all' }"
          @click="selectedCategory = 'all'"
        >
          All Notices ({{ allNotices.length }})
        </button>
        <button
          type="button"
          class="filter-tab-btn"
          :class="{ 'tab-active': selectedCategory === 'schedule' }"
          @click="selectedCategory = 'schedule'"
        >
          Schedule &amp; Darshan
        </button>
        <button
          type="button"
          class="filter-tab-btn"
          :class="{ 'tab-active': selectedCategory === 'seva' }"
          @click="selectedCategory = 'seva'"
        >
          Volunteer &amp; Seva
        </button>
        <button
          type="button"
          class="filter-tab-btn"
          :class="{ 'tab-active': selectedCategory === 'facility' }"
          @click="selectedCategory = 'facility'"
        >
          Sanctum Facilities
        </button>
        <button
          type="button"
          class="filter-tab-btn"
          :class="{ 'tab-active': selectedCategory === 'welfare' }"
          @click="selectedCategory = 'welfare'"
        >
          Humanitarian Welfare
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="noticesStatus === 'pending' && displayedNotices.length === 0" class="loading-state">
        <div class="spinner" aria-hidden="true"></div>
        <p>Loading temple announcements...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="displayedNotices.length === 0" class="empty-state">
        <h3 class="empty-title">No notices in this category</h3>
        <p class="empty-sub">Please select another category or view all announcements.</p>
        <button type="button" class="btn-reset-filter" @click="selectedCategory = 'all'">Show All Notices</button>
      </div>

      <!-- 3. NOTICES LIST -->
      <section v-else class="notices-list" aria-label="Official Temple Notices">
        <article
          v-for="notice in displayedNotices"
          :key="notice.id || notice.slug"
          class="notice-card"
          :class="{ 'card-pinned': notice.pinned }"
        >
          <div class="notice-meta-bar">
            <div class="meta-left">
              <span v-if="notice.pinned" class="pinned-tag">Pinned Circular</span>
              <span class="category-pill">{{ notice.category }}</span>
            </div>
            <time :datetime="notice.date" class="notice-date">{{ formatDate(notice.date) }}</time>
          </div>

          <h2 class="notice-title">{{ notice.title }}</h2>

          <div class="notice-body">
            <p>{{ notice.body }}</p>
          </div>
        </article>
      </section>

      <!-- 4. BOTTOM ADVISORY DESK CARD -->
      <section class="help-info-card" aria-label="Pilgrim Inquiries">
        <div class="info-content">
          <span class="info-kicker">Pilgrim Assistance</span>
          <h2 class="info-title">Have Questions About Temple Guidelines?</h2>
          <p class="info-text">
            For specific inquiries regarding wedding rituals, antimicrobial sanctum guidelines, or special photography permissions,
            please send a message to the temple administrative desk.
          </p>
        </div>
        <div class="info-actions">
          <NuxtLink to="/contact" class="btn-primary-action">
            Contact Office
          </NuxtLink>
          <NuxtLink to="/puja-and-rituals" class="btn-secondary-action">
            Puja &amp; Rituals
          </NuxtLink>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ----------------------------------------------------
   TEMPLE NOTICES & NEWS STYLING
   Minimal, calm, readable, and consistent.
   ---------------------------------------------------- */
.notices-page {
  width: 100%;
  min-height: 85vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding-top: calc(var(--nav-height, 72px) + 2rem);
  padding-bottom: 5rem;
}

.page-hero {
  padding: 2.5rem 1.5rem 2rem;
  text-align: center;
}

.hero-inner {
  max-width: 780px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-block;
  padding: 0.35rem 0.9rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent-text);
  background-color: rgba(110, 5, 22, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  margin-bottom: 1.25rem;
}

html[data-theme="dark"] .hero-badge,
html.dark .hero-badge {
  background-color: rgba(230, 179, 74, 0.08);
}

.hero-title {
  font-family: var(--font-serif);
  font-size: clamp(2.2rem, 4.2vw, 3.4rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.015em;
  color: var(--heading-color);
  margin: 0 0 1rem;
}

.hero-subtitle {
  font-size: clamp(1rem, 1.8vw, 1.125rem);
  line-height: 1.65;
  color: var(--text-secondary);
  margin: 0 auto;
  max-width: 650px;
}

.hero-divider {
  width: 56px;
  height: 2px;
  background: var(--accent);
  margin: 2rem auto 0;
  opacity: 0.75;
}

.page-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 0;
}

/* ====================================================
   FILTER TABS BAR
   ==================================================== */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.65rem;
  margin-bottom: 3rem;
}

.filter-tab-btn {
  padding: 0.55rem 1.1rem;
  font-size: 0.825rem;
  font-weight: 600;
  border-radius: 9999px;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.filter-tab-btn:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

.tab-active {
  background-color: var(--btn-primary-bg) !important;
  color: var(--btn-primary-text) !important;
  border-color: var(--btn-primary-bg) !important;
}

/* ====================================================
   NOTICES LIST
   ==================================================== */
.notices-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 5rem;
}

.notice-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 2rem;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.notice-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.05);
}

.card-pinned {
  border-left: 4px solid var(--accent-text);
}

.notice-meta-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pinned-tag {
  font-size: 0.725rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.25rem 0.65rem;
  border-radius: 4px;
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

.category-pill {
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  color: var(--accent-text);
}

.notice-date {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--text-muted);
}

.notice-title {
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.85rem;
  line-height: 1.3;
}

.notice-body {
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--text-secondary);
}

.notice-body p {
  margin: 0;
}

/* ====================================================
   BOTTOM ADVISORY CARD
   ==================================================== */
.help-info-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 18px;
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
}

@media (min-width: 800px) {
  .help-info-card {
    flex-direction: row;
    justify-content: space-between;
    padding: 3rem;
  }
}

.info-content {
  max-width: 600px;
}

.info-kicker {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-text);
  display: block;
  margin-bottom: 0.5rem;
}

.info-title {
  font-family: var(--font-serif);
  font-size: clamp(1.4rem, 2.2vw, 1.85rem);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.75rem;
  line-height: 1.25;
}

.info-text {
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--text-secondary);
  margin: 0;
}

.info-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  flex-shrink: 0;
}

.btn-primary-action {
  padding: 0.75rem 1.4rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--btn-primary-text);
  background-color: var(--btn-primary-bg);
  border: 1px solid var(--btn-primary-bg);
  border-radius: 8px;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  transition: all 0.15s ease;
}

.btn-primary-action:hover {
  background-color: var(--btn-primary-hover);
  border-color: var(--btn-primary-hover);
}

.btn-secondary-action {
  padding: 0.75rem 1.4rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  transition: all 0.15s ease;
}

.btn-secondary-action:hover {
  background-color: var(--nav-hover-bg);
  border-color: var(--accent);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-muted);
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-sub {
  font-size: 0.925rem;
  margin-bottom: 1.5rem;
}

.btn-reset-filter {
  padding: 0.6rem 1.2rem;
  font-size: 0.825rem;
  font-weight: 600;
  border-radius: 8px;
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: none;
  cursor: pointer;
  font-family: inherit;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(224, 165, 38, 0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
