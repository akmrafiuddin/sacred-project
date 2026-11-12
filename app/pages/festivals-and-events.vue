<script setup lang="ts">
import { ref, computed } from "vue";

interface EventDisplayItem {
  id: number | string;
  slug: string;
  date: string; // YYYY-MM-DD
  kind: "special_puja" | "festival" | "seva" | "other";
  title: string;
  label: string;
  time: string;
  description: string;
}

// Canonical default events fallback
const defaultEvents: EventDisplayItem[] = [
  {
    id: 1,
    slug: "special-kali-aradhana",
    date: "2026-11-10",
    kind: "special_puja",
    title: "Special Kali Aradhana & Deepam",
    label: "Kartika Shukla Pratipada",
    time: "7:00 PM",
    description: "Special evening pancha-pradip offering, Chandi stotram recital, and sanctified mahaprasad distribution.",
  },
  {
    id: 2,
    slug: "utpanna-ekadashi",
    date: "2026-11-12",
    kind: "special_puja",
    title: "Utpanna Ekadashi Vrata",
    label: "Kartika Shukla Ekadashi",
    time: "5:30 AM & 6:00 PM",
    description: "Special early darshan, continuous Vishnu Sahasranama chanting, and fruit offerings for devotees observing vrata.",
  },
  {
    id: 3,
    slug: "gopashtami-go-puja",
    date: "2026-11-18",
    kind: "special_puja",
    title: "Gopashtami Go-Puja",
    label: "Kartika Shukla Ashtami",
    time: "9:00 AM",
    description: "Special morning cow worship ceremony, grass offering, and sacred hymns honoring the auspicious mother cow.",
  },
  {
    id: 4,
    slug: "kartika-purnima",
    date: "2026-11-24",
    kind: "festival",
    title: "Kartika Purnima Maha Deepotsav",
    label: "Kartika Purnima",
    time: "6:00 PM - 10:00 PM",
    description: "Lighting of 1,008 earthen lamps, sacred conch resonance, and special Ganga aarti style darshan.",
  },
  {
    id: 5,
    slug: "maha-shivaratri",
    date: "2026-03-08",
    kind: "festival",
    title: "Maha Shivaratri",
    label: "Phalguna Krishna Chaturdashi",
    time: "All Night Vigil",
    description: "All-night continuous abhishekam, Rudram chanting, special Maha Aarti, and devotee vigil until morning.",
  },
  {
    id: 6,
    slug: "dol-purnima",
    date: "2026-03-25",
    kind: "festival",
    title: "Dol Purnima (Holi)",
    label: "Phalguna Shukla Purnima",
    time: "8:00 AM - 1:00 PM",
    description: "Morning abir offering to Sri Radha Krishna, devotional kirtan, and sacred sweets distribution.",
  },
  {
    id: 7,
    slug: "rama-navami",
    date: "2026-04-17",
    kind: "festival",
    title: "Sri Rama Navami",
    label: "Chaitra Shukla Navami",
    time: "12:00 PM Midday",
    description: "Midday Janmotsav aarti, Ramayana path recitation, and community Annadanam feast.",
  },
  {
    id: 8,
    slug: "guru-purnima",
    date: "2026-07-21",
    kind: "festival",
    title: "Guru Purnima",
    label: "Ashadha Shukla Purnima",
    time: "9:00 AM",
    description: "Special morning puja and paduka archana honoring sacred Vedic preceptors and spiritual lineage.",
  },
];

// Fetch events from public endpoint
const { data: eventsResponse, status: eventsStatus } = await useFetch<{ items: any[] }>(
  "/api/public/events",
  {
    key: "public_events_list",
    server: true,
  }
);

// Filter state
type FilterTab = "all" | "upcoming" | "festival" | "special_puja";
const activeFilter = ref<FilterTab>("all");

// Today's ISO date string
const todayIso = new Date().toISOString().slice(0, 10);

// Normalize and map items
const allEvents = computed<EventDisplayItem[]>(() => {
  const items = eventsResponse.value?.items;
  if (Array.isArray(items) && items.length > 0) {
    return items
      .filter((e) => e.active !== false)
      .map((e) => ({
        id: e.id || e.slug,
        slug: e.slug || "",
        date: e.date || "",
        kind: e.kind || "festival",
        title: typeof e.title === "object" ? e.title?.en || e.title?.bn || "Sacred Event" : e.title || "Sacred Event",
        label: typeof e.label === "object" ? e.label?.en || e.label?.bn || "" : e.label || "",
        time: e.time || "",
        description: typeof e.description === "object" ? e.description?.en || e.description?.bn || "" : e.description || "",
      }));
  }
  return defaultEvents;
});

// Filtered events
const displayedEvents = computed<EventDisplayItem[]>(() => {
  return allEvents.value.filter((event) => {
    if (activeFilter.value === "upcoming") {
      return event.date >= todayIso;
    }
    if (activeFilter.value === "festival") {
      return event.kind === "festival";
    }
    if (activeFilter.value === "special_puja") {
      return event.kind === "special_puja";
    }
    return true;
  });
});

// Helper to format date badges
const parseDateBadge = (dateStr: string) => {
  if (!dateStr) return { month: "CAL", day: "--" };
  const parts = dateStr.split("-");
  if (parts.length < 3) return { month: "CAL", day: "--" };
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(parts[2]).padStart(2, "0");
  return { month, day };
};

const formatKindLabel = (kind: string) => {
  switch (kind) {
    case "festival":
      return "Major Festival";
    case "special_puja":
      return "Special Puja";
    case "seva":
      return "Devotee Seva";
    default:
      return "Sacred Event";
  }
};

useHead({
  title: "Festivals & Sacred Events - Golpahar Mohashoshan Kali Mandir",
  meta: [
    {
      name: "description",
      content:
        "Sacred annual festivals, Kartika Purnima, Maha Shivaratri, Dol Purnima, and special Kali Puja celebrations at Golpahar Mohashoshan Kali Mandir in Chittagong.",
    },
    {
      property: "og:title",
      content: "Festivals & Sacred Events - Golpahar Kali Mandir",
    },
    {
      property: "og:description",
      content:
        "Join in the sacred celebrations, devotional vigils, and holy vrata observances at Golpahar Kali Mandir.",
    },
  ],
});
</script>

<template>
  <div class="events-page" lang="en">
    <!-- 1. HERO HEADER -->
    <header class="page-hero">
      <div class="hero-inner">
        <span class="hero-badge">Sacred Calendar &amp; Celebrations</span>
        <h1 class="hero-title">Festivals &amp; Sacred Events</h1>
        <p class="hero-subtitle">
          Annual celebrations, holy vrata observances, and sacred tithis celebrated with traditional joy
          and devotional solemnity at Golpahar Mohashoshan Kali Mandir.
        </p>
        <div class="hero-divider" aria-hidden="true"></div>
      </div>
    </header>

    <main class="page-container">
      <!-- 2. FILTER PILLS BAR -->
      <div class="filter-bar">
        <button
          type="button"
          class="filter-tab-btn"
          :class="{ 'tab-active': activeFilter === 'all' }"
          @click="activeFilter = 'all'"
        >
          All Events ({{ allEvents.length }})
        </button>
        <button
          type="button"
          class="filter-tab-btn"
          :class="{ 'tab-active': activeFilter === 'upcoming' }"
          @click="activeFilter = 'upcoming'"
        >
          Upcoming
        </button>
        <button
          type="button"
          class="filter-tab-btn"
          :class="{ 'tab-active': activeFilter === 'festival' }"
          @click="activeFilter = 'festival'"
        >
          Major Festivals
        </button>
        <button
          type="button"
          class="filter-tab-btn"
          :class="{ 'tab-active': activeFilter === 'special_puja' }"
          @click="activeFilter = 'special_puja'"
        >
          Special Pujas &amp; Vratas
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="eventsStatus === 'pending' && displayedEvents.length === 0" class="loading-state">
        <div class="spinner" aria-hidden="true"></div>
        <p>Loading temple festival calendar...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="displayedEvents.length === 0" class="empty-state">
        <h3 class="empty-title">No events found in this category</h3>
        <p class="empty-sub">Please switch to "All Events" to view upcoming temple celebrations.</p>
        <button type="button" class="btn-reset-filter" @click="activeFilter = 'all'">Show All Events</button>
      </div>

      <!-- 3. EVENTS GRID -->
      <section v-else class="events-grid" aria-label="Temple Events and Festivals">
        <article
          v-for="event in displayedEvents"
          :key="event.id || event.slug"
          class="event-card"
        >
          <div class="event-card-header">
            <!-- Calendar Date Badge -->
            <div class="date-badge">
              <span class="badge-month">{{ parseDateBadge(event.date).month }}</span>
              <span class="badge-day">{{ parseDateBadge(event.date).day }}</span>
            </div>

            <!-- Kind Pill -->
            <span class="kind-tag" :class="`kind-${event.kind}`">
              {{ formatKindLabel(event.kind) }}
            </span>
          </div>

          <div class="event-card-body">
            <h2 class="event-title">{{ event.title }}</h2>

            <div v-if="event.label || event.time" class="event-meta-row">
              <span v-if="event.label" class="meta-tithi">{{ event.label }}</span>
              <span v-if="event.label && event.time" class="meta-dot">•</span>
              <span v-if="event.time" class="meta-time">{{ event.time }}</span>
            </div>

            <p class="event-desc">{{ event.description }}</p>
          </div>

          <div class="event-card-footer">
            <NuxtLink
              :to="`/contact?subject=${encodeURIComponent('Inquiry: ' + event.title)}`"
              class="btn-event-inquire"
            >
              Festival Seva &amp; Darshan Inquiry &rarr;
            </NuxtLink>
          </div>
        </article>
      </section>

      <!-- 4. BOTTOM SEVA & VISITOR ADVISORY CARD -->
      <section class="festival-info-card" aria-label="Devotee Festival Information">
        <div class="info-content">
          <span class="info-kicker">Festival Participation</span>
          <h2 class="info-title">Sponsor Annadanam &amp; Festival Seva</h2>
          <p class="info-text">
            During major festivals such as Kartika Purnima and Maha Shivaratri, thousands of pilgrims visit the sanctum.
            Devotees may sponsor the holy Annadanam feast, sacred flowers, or deepam lamps in memory of loved ones.
          </p>
        </div>
        <div class="info-actions">
          <NuxtLink to="/donation" class="btn-primary-action">
            Sponsor Seva
          </NuxtLink>
          <NuxtLink to="/contact" class="btn-secondary-action">
            Contact Temple Office
          </NuxtLink>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ----------------------------------------------------
   FESTIVALS & EVENTS PAGE STYLING
   Minimal, calm, and aligned with design system.
   ---------------------------------------------------- */
.events-page {
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
  max-width: 1200px;
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
   EVENTS GRID
   ==================================================== */
.events-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 5rem;
}

@media (min-width: 720px) {
  .events-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.event-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.event-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.06);
}

html[data-theme="dark"] .event-card:hover,
html.dark .event-card:hover {
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.35);
}

.event-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border-radius: 10px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  text-align: center;
}

.badge-month {
  font-size: 0.675rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--accent-text);
  line-height: 1;
}

.badge-day {
  font-family: var(--font-serif);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.kind-tag {
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  background-color: rgba(110, 5, 22, 0.06);
  border: 1px solid var(--border-subtle);
  color: var(--accent-text);
}

.event-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.event-title {
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
  line-height: 1.25;
}

.event-meta-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--accent-text);
  margin-bottom: 1rem;
}

.meta-dot {
  opacity: 0.5;
}

.event-desc {
  font-size: 0.925rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 0 1.5rem;
  flex: 1;
}

.event-card-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.btn-event-inquire {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--accent-text);
  text-decoration: none;
  transition: all 0.15s ease;
  display: inline-block;
}

.btn-event-inquire:hover {
  text-decoration: underline;
}

/* ====================================================
   BOTTOM ADVISORY CARD
   ==================================================== */
.festival-info-card {
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
  .festival-info-card {
    flex-direction: row;
    justify-content: space-between;
    padding: 3rem;
  }
}

.info-content {
  max-width: 680px;
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
