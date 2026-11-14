<script setup lang="ts">
import { computed } from "vue";

interface PujaDisplayItem {
  id: number | string;
  slug: string;
  name: string;
  description: string;
  offered: string;
  priceBdt: number;
  duration: string;
  bookable: boolean;
  sortOrder: number;
}

interface ScheduleDisplayItem {
  id: number;
  time: string;
  title: string;
  description: string;
  sortOrder: number;
}

// Canonical default pujas fallback
const defaultPujas: PujaDisplayItem[] = [
  {
    id: 1,
    slug: "nitya-puja",
    name: "Nitya Puja",
    description: "The daily worship, offered on your behalf with your name and gotra read in the sankalpa.",
    offered: "Flowers, bel patra, incense, bhog and prasad",
    priceBdt: 501,
    duration: "45 minutes",
    bookable: true,
    sortOrder: 1,
  },
  {
    id: 2,
    slug: "satyanarayan-puja",
    name: "Satyanarayan Puja",
    description: "For a vow kept, a home blessed, or a promise fulfilled. Performed with the Satyanarayan katha.",
    offered: "Fruit, panchamrit, sweets and prasad for the household",
    priceBdt: 1501,
    duration: "2 hours",
    bookable: true,
    sortOrder: 2,
  },
  {
    id: 3,
    slug: "rudrabhishek",
    name: "Rudrabhishek",
    description: "Milk, honey and water poured over the Shiva lingam while the Rudram is chanted.",
    offered: "All samagri, flowers and prasad",
    priceBdt: 2001,
    duration: "1 hour 30 minutes",
    bookable: true,
    sortOrder: 3,
  },
  {
    id: 4,
    slug: "kali-puja",
    name: "Kali Puja (Individual)",
    description: "An individual Kali puja on the temple's Kali Puja night, with your name in the sankalpa.",
    offered: "Hibiscus, sindoor, lamps, prasad",
    priceBdt: 2501,
    duration: "1 hour",
    bookable: true,
    sortOrder: 4,
  },
];

// Canonical default daily schedule fallback
const defaultSchedule: ScheduleDisplayItem[] = [
  {
    id: 1,
    time: "05:00",
    title: "Mangal Aarti",
    description: "The sanctum opens, the sacred lamp is lit, and the divine mother is awoken with conch and bell resonance.",
    sortOrder: 1,
  },
  {
    id: 2,
    time: "07:00",
    title: "Nitya Puja",
    description: "Daily morning worship: snana, dressing, fresh floral garlands, sacred incense, and morning bhog.",
    sortOrder: 2,
  },
  {
    id: 3,
    time: "12:30",
    title: "Madhyanha Bhog",
    description: "Traditional consecrated rice, lentils, vegetables, and sweets offered, followed by distribution to devotees.",
    sortOrder: 3,
  },
  {
    id: 4,
    time: "18:30",
    title: "Sandhya Aarti",
    description: "The sacred evening lamp offering with resonant bells and conch. The temple's most vibrant darshan period.",
    sortOrder: 4,
  },
  {
    id: 5,
    time: "21:30",
    title: "Shayan Aarti",
    description: "The concluding evening prayers and devotional bedtime lullaby. The sanctum doors close for the night.",
    sortOrder: 5,
  },
];

// Fetch pujas from public API
const { data: pujasResponse, status: pujasStatus } = await useFetch<{ items: any[] }>(
  "/api/public/pujas",
  {
    key: "public_pujas_list",
    server: true,
  }
);

// Fetch daily schedule from public API
const { data: scheduleResponse } = await useFetch<{ items: any[] }>(
  "/api/public/schedule",
  {
    key: "public_schedule_list",
    server: true,
  }
);

// Format and sort pujas
const displayedPujas = computed<PujaDisplayItem[]>(() => {
  const items = pujasResponse.value?.items;
  if (Array.isArray(items) && items.length > 0) {
    return items
      .filter((p) => p.active !== false)
      .map((p) => ({
        id: p.id || p.slug,
        slug: p.slug || "",
        name: typeof p.name === "object" ? p.name?.en || p.name?.bn || "Puja" : p.name || "Puja",
        description: typeof p.description === "object" ? p.description?.en || p.description?.bn || "" : p.description || "",
        offered: typeof p.offered === "object" ? p.offered?.en || p.offered?.bn || "" : p.offered || "",
        priceBdt: Number(p.priceBdt || p.price_bdt || 0),
        duration: p.duration || "",
        bookable: p.bookable !== false,
        sortOrder: p.sortOrder ?? 0,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return defaultPujas;
});

// Format and sort schedule
const displayedSchedule = computed<ScheduleDisplayItem[]>(() => {
  const items = scheduleResponse.value?.items;
  if (Array.isArray(items) && items.length > 0) {
    return items
      .filter((s) => s.active !== false)
      .map((s) => ({
        id: s.id,
        time: s.time || "",
        title: typeof s.title === "object" ? s.title?.en || s.title?.bn || "Aarti" : s.title || "Aarti",
        description: typeof s.description === "object" ? s.description?.en || s.description?.bn || "" : s.description || "",
        sortOrder: s.sortOrder ?? 0,
      }))
      .sort((a, b) => (a.time > b.time ? 1 : -1));
  }
  return defaultSchedule;
});

const formatTime12h = (time24: string) => {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr || "0", 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${m} ${ampm}`;
};

useHead({
  title: "Puja & Daily Rituals - Golpahar Mohashoshan Kali Mandir",
  meta: [
    {
      name: "description",
      content:
        "Sacred Vedic pujas, sankalpa offerings, and daily aarti schedule at Golpahar Mohashoshan Kali Mandir in Chittagong. Book a puja, participate in Annadanam, and experience sanctified darshan.",
    },
    {
      property: "og:title",
      content: "Puja Offerings & Daily Rituals - Golpahar Kali Mandir",
    },
    {
      property: "og:description",
      content:
        "Daily aartis from 5:00 AM to 9:30 PM, Vedic puja sankalpas, and devotee services at Golpahar Kali Mandir.",
    },
  ],
});
</script>

<template>
  <div class="puja-page" lang="en">
    <!-- 1. HERO HEADER -->
    <header class="page-hero">
      <div class="hero-inner">
        <span class="hero-badge">Sacred Worship &amp; Devotion</span>
        <h1 class="hero-title">Puja &amp; Daily Rituals</h1>
        <p class="hero-subtitle">
          Vedic rituals, sacred sankalpa offerings, and timeless daily aartis conducted with solemn devotion
          and traditional sanctity at Golpahar Mohashoshan Kali Mandir.
        </p>
        <div class="hero-divider" aria-hidden="true"></div>
      </div>
    </header>

    <main class="page-container">
      <!-- 2. DAILY AARTI SCHEDULE SECTION -->
      <section class="schedule-section" aria-label="Daily Aarti Schedule">
        <div class="section-header">
          <span class="section-kicker">Sanctum Rhythm</span>
          <h2 class="section-title">Daily Aarti &amp; Darshan Schedule</h2>
          <p class="section-sub">
            The temple gates and inner sanctum open according to five canonical daily worship hours:
          </p>
        </div>

        <div class="schedule-timeline">
          <article
            v-for="(item, idx) in displayedSchedule"
            :key="item.id || idx"
            class="timeline-card"
          >
            <div class="time-badge">
              <span class="time-main">{{ formatTime12h(item.time) }}</span>
              <span class="time-step">Ritual {{ String(idx + 1).padStart(2, '0') }}</span>
            </div>
            <div class="timeline-body">
              <h3 class="ritual-title">{{ item.title }}</h3>
              <p class="ritual-desc">{{ item.description }}</p>
            </div>
          </article>
        </div>
      </section>

      <!-- 3. PUJA OFFERINGS & CHARGES SECTION -->
      <section class="pujas-section" aria-label="Puja Offerings and Seva Charges">
        <div class="section-header">
          <span class="section-kicker">Devotee Offerings</span>
          <h2 class="section-title">Puja Services &amp; Sankalpa Charges</h2>
          <p class="section-sub">
            Devotees may sponsor individual pujas with family name and gotra pronounced in the sacred Vedic sankalpa.
          </p>
        </div>

        <div v-if="pujasStatus === 'pending' && displayedPujas.length === 0" class="loading-state">
          <div class="spinner" aria-hidden="true"></div>
          <p>Loading consecrated puja offerings...</p>
        </div>

        <div v-else class="pujas-grid">
          <article
            v-for="(puja, idx) in displayedPujas"
            :key="puja.id || puja.slug"
            class="puja-card"
          >
            <div class="puja-card-header">
              <span class="puja-number">{{ String(idx + 1).padStart(2, '0') }}</span>
              <div class="puja-pricing">
                <span class="puja-price">BDT {{ puja.priceBdt.toLocaleString() }}</span>
                <span v-if="puja.duration" class="puja-duration">{{ puja.duration }}</span>
              </div>
            </div>

            <div class="puja-card-body">
              <h3 class="puja-name">{{ puja.name }}</h3>
              <p class="puja-desc">{{ puja.description }}</p>

              <div v-if="puja.offered" class="puja-samagri">
                <span class="samagri-label">Samagri &amp; Offerings Included:</span>
                <span class="samagri-text">{{ puja.offered }}</span>
              </div>
            </div>

            <div class="puja-card-footer">
              <NuxtLink
                :to="`/puja-booking?puja=${puja.slug}&id=${puja.id}`"
                class="btn-book-puja"
                :aria-label="`Request booking for ${puja.name}`"
              >
                Request Puja Booking
              </NuxtLink>
            </div>
          </article>
        </div>
      </section>

      <!-- 4. BOTTOM PILGRIM DARSHAN CARD -->
      <section class="visitation-card" aria-label="Pilgrim Information">
        <div class="visitation-text">
          <span class="visitation-kicker">Devotee Assistance Desk</span>
          <h2 class="visitation-title">Custom Rites &amp; Special Occasions</h2>
          <p class="visitation-desc">
            For ancestral shraddha, special Chandi path, birth blessings, or specific family sankalpa rites,
            please connect directly with the temple priests or administration office.
          </p>
        </div>
        <div class="visitation-actions">
          <NuxtLink to="/contact" class="btn-primary-action">
            Contact Devotee Desk
          </NuxtLink>
          <NuxtLink to="/deities" class="btn-secondary-action">
            View Sacred Deities
          </NuxtLink>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ----------------------------------------------------
   PUJA & RITUALS PAGE STYLING
   Follows core palette & minimal typography.
   ---------------------------------------------------- */
.puja-page {
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

.section-header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 2.5rem;
}

.section-kicker {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-text);
  display: block;
  margin-bottom: 0.4rem;
}

.section-title {
  font-family: var(--font-serif);
  font-size: clamp(1.6rem, 2.6vw, 2.2rem);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.6rem;
}

.section-sub {
  font-size: 0.975rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}

/* ====================================================
   SCHEDULE TIMELINE CARDS
   ==================================================== */
.schedule-section {
  margin-bottom: 5rem;
}

.schedule-timeline {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 768px) {
  .schedule-timeline {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .schedule-timeline {
    grid-template-columns: repeat(5, 1fr);
    gap: 1rem;
  }
}

.timeline-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.timeline-card:hover {
  transform: translateY(-3px);
  border-color: var(--accent);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
}

.time-badge {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-subtle);
}

.time-main {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-text);
}

.time-step {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.ritual-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.ritual-desc {
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--text-secondary);
  margin: 0;
}

/* ====================================================
   PUJAS OFFERINGS GRID
   ==================================================== */
.pujas-section {
  margin-bottom: 5rem;
}

.pujas-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 720px) {
  .pujas-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.puja-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.puja-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.06);
}

html[data-theme="dark"] .puja-card:hover,
html.dark .puja-card:hover {
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.35);
}

.puja-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--border-subtle);
}

.puja-number {
  font-family: var(--font-serif);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.puja-pricing {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.puja-price {
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--accent-text);
}

.puja-duration {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}

.puja-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.puja-name {
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.75rem;
  line-height: 1.25;
}

.puja-desc {
  font-size: 0.925rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 0 1.25rem;
  flex: 1;
}

.puja-samagri {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.825rem;
}

.samagri-label {
  font-weight: 700;
  color: var(--accent-text);
  display: block;
  margin-bottom: 0.2rem;
}

.samagri-text {
  color: var(--text-secondary);
  line-height: 1.45;
}

.puja-card-footer {
  margin-top: auto;
}

.btn-book-puja {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  color: var(--btn-primary-text);
  background-color: var(--btn-primary-bg);
  border: 1px solid var(--btn-primary-bg);
  border-radius: 8px;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-book-puja:hover {
  background-color: var(--btn-primary-hover);
  border-color: var(--btn-primary-hover);
}

/* ====================================================
   BOTTOM VISITATION / SEVA DESK CARD
   ==================================================== */
.visitation-card {
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
  .visitation-card {
    flex-direction: row;
    justify-content: space-between;
    padding: 3rem;
  }
}

.visitation-text {
  max-width: 680px;
}

.visitation-kicker {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-text);
  display: block;
  margin-bottom: 0.5rem;
}

.visitation-title {
  font-family: var(--font-serif);
  font-size: clamp(1.4rem, 2.2vw, 1.85rem);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.75rem;
  line-height: 1.25;
}

.visitation-desc {
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--text-secondary);
  margin: 0;
}

.visitation-actions {
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

.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
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
