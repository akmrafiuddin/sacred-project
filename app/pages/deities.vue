<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

interface DeityDisplayItem {
  id: number | string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  image: string;
  sortOrder: number;
}

// Canonical fallback deities if the API is loading or empty
const defaultDeities: DeityDisplayItem[] = [
  {
    id: 1,
    slug: "shiva",
    name: "Lord Shiva",
    subtitle: "Mahadeva • The Auspicious One",
    description:
      "Revered as the eternal ascetic, supreme source of yogic stillness, compassion, and divine cosmic harmony.",
    image: "/images/deities/shiva.jpg",
    sortOrder: 1,
  },
  {
    id: 2,
    slug: "kali",
    name: "Maa Kali",
    subtitle: "Bhavatarini • The Divine Mother",
    description:
      "The fierce and loving eternal protector who dispels ignorance, removes ego, and shields all pure devotees.",
    image: "/images/deities/kali.jpg",
    sortOrder: 2,
  },
  {
    id: 3,
    slug: "ganesha",
    name: "Lord Ganesha",
    subtitle: "Vighnaharta • Remover of Obstacles",
    description:
      "Worshipped first across all sacred rites, granting divine wisdom, auspicious beginnings, and spiritual intellect.",
    image: "/images/deities/ganesha.jpg",
    sortOrder: 3,
  },
  {
    id: 4,
    slug: "krishna",
    name: "Shri Radha Krishna",
    subtitle: "Radha Vallabh • Eternal Divine Love",
    description:
      "The eternal embodiment of sacred love, divine melody, spiritual wisdom, and selfless devotional surrender.",
    image: "/images/deities/krishna.jpg",
    sortOrder: 4,
  },
  {
    id: 5,
    slug: "lakshmi",
    name: "Maa Lakshmi",
    subtitle: "Sri • Bestower of Purity & Abundance",
    description:
      "The eternal consort of Vishnu, granting spiritual illumination, fortune, auspicious peace, and sacred nourishment.",
    image: "/images/deities/lakshmi.jpg",
    sortOrder: 5,
  },
];

// Fetch active deities from backend public API
const { data: serverResponse, status } = await useFetch<{ items: any[] }>(
  "/api/public/deities",
  {
    key: "public_deities_list",
    server: true,
  }
);

// Map and normalize server data with fallback
const displayedDeities = computed<DeityDisplayItem[]>(() => {
  const items = serverResponse.value?.items;
  if (Array.isArray(items) && items.length > 0) {
    return items
      .filter((item) => item.active !== false)
      .map((item) => ({
        id: item.id || item.slug,
        slug: item.slug || "",
        name: typeof item.name === "object" ? item.name?.en || item.name?.bn || "Sacred Deity" : item.name || "Sacred Deity",
        subtitle: typeof item.subtitle === "object" ? item.subtitle?.en || item.subtitle?.bn || "" : item.subtitle || "",
        description: typeof item.description === "object" ? item.description?.en || item.description?.bn || "" : item.description || "",
        image: item.imageId || item.image || "/images/deities/kali.jpg",
        sortOrder: item.sortOrder ?? 0,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return defaultDeities;
});

// Full Darshan View Modal
const selectedDeity = ref<DeityDisplayItem | null>(null);

const openDarshan = (deity: DeityDisplayItem) => {
  selectedDeity.value = deity;
};

const closeDarshan = () => {
  selectedDeity.value = null;
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && selectedDeity.value) {
    closeDarshan();
  }
};

onMounted(() => {
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleKeyDown);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleKeyDown);
  }
});

useHead({
  title: "The Sacred Deities & Shrines - Golpahar Mohashoshan Kali Mandir",
  meta: [
    {
      name: "description",
      content:
        "Explore the consecrated deities and sacred shrines of Golpahar Mohashoshan Kali Mandir in Chittagong: Maa Kali, Lord Shiva, Lord Ganesha, Radha Krishna, and Maa Lakshmi.",
    },
    {
      property: "og:title",
      content: "The Sacred Deities & Shrines - Golpahar Kali Mandir",
    },
    {
      property: "og:description",
      content:
        "Consecrated deities, spiritual history, and daily darshan at Golpahar Mohashoshan Kali Mandir.",
    },
  ],
});
</script>

<template>
  <div class="deities-page" lang="en">
    <!-- 1. HERO HEADER SECTION -->
    <header class="deities-hero">
      <div class="hero-inner">
        <span class="hero-badge">Sacred Sanctum &amp; Shrines</span>
        <h1 class="hero-title">The Sacred Deities</h1>
        <p class="hero-subtitle">
          The consecrated deities and eternal shrines of Golpahar Mohashoshan Kali Mandir,
          established across generations to bestow peace, divine protection, and spiritual solace upon all devotees.
        </p>
        <div class="hero-divider" aria-hidden="true"></div>
      </div>
    </header>

    <!-- 2. DEITIES MAIN CONTAINER -->
    <main class="deities-container">
      <!-- Loading Skeleton -->
      <div v-if="status === 'pending' && displayedDeities.length === 0" class="loading-state">
        <div class="spinner" aria-hidden="true"></div>
        <p>Loading sanctum darshan...</p>
      </div>

      <!-- Deities Grid -->
      <section v-else class="deities-grid" aria-label="Consecrated Deities List">
        <article
          v-for="deity in displayedDeities"
          :key="deity.id || deity.slug"
          class="deity-card"
        >
          <!-- Deity Portrait Image Frame -->
          <div class="card-media" @click="openDarshan(deity)">
            <img
              :src="deity.image"
              :alt="deity.name"
              class="deity-image"
              loading="lazy"
              onerror="this.src='/images/deities/kali.jpg'"
            />
            <div class="media-overlay">
              <span class="view-darshan-badge">View Darshan</span>
            </div>
          </div>

          <!-- Deity Content Details -->
          <div class="card-body">
            <span v-if="deity.subtitle" class="deity-subtitle">
              {{ deity.subtitle }}
            </span>
            <h2 class="deity-name">
              {{ deity.name }}
            </h2>
            <p class="deity-desc">
              {{ deity.description }}
            </p>

            <div class="card-actions">
              <button
                type="button"
                class="btn-darshan-link"
                @click="openDarshan(deity)"
                :aria-label="`Open sacred darshan for ${deity.name}`"
              >
                Sacred Darshan
              </button>
              <NuxtLink
                to="/puja-booking"
                class="btn-puja-link"
                :aria-label="`Book a puja for ${deity.name}`"
              >
                Offer Puja
              </NuxtLink>
            </div>
          </div>
        </article>
      </section>

      <!-- 3. PEACEFUL DARSHAN & VISITATION CARD -->
      <section class="darshan-info-card" aria-label="Daily Darshan Information">
        <div class="info-content">
          <span class="info-kicker">Sanctum Darshan &amp; Rituals</span>
          <h2 class="info-title">Daily Darshan for Devotees &amp; Pilgrims</h2>
          <p class="info-text">
            The temple sanctum opens daily for morning prayers, noon bhog, and evening sandhya aarti.
            Devotees and visitors from all backgrounds are welcome to offer silent prayers, receive consecrated prasad,
            and participate in peace and devotion.
          </p>
        </div>
        <div class="info-actions">
          <NuxtLink to="/puja-list-and-charges" class="btn-primary-action">
            Puja Services &amp; Charges
          </NuxtLink>
          <NuxtLink to="/contact" class="btn-secondary-action">
            Plan A Visit
          </NuxtLink>
        </div>
      </section>
    </main>

    <!-- 4. LIGHTBOX / EXPANDED DARSHAN MODAL -->
    <Teleport to="body">
      <div
        v-if="selectedDeity"
        class="darshan-modal-backdrop"
        @click.self="closeDarshan"
        role="dialog"
        aria-modal="true"
        :aria-label="`${selectedDeity.name} Darshan View`"
      >
        <div class="darshan-modal-box">
          <button
            type="button"
            class="modal-close-button"
            @click="closeDarshan"
            aria-label="Close darshan view"
          >
            &times;
          </button>

          <div class="modal-layout">
            <div class="modal-image-col">
              <img
                :src="selectedDeity.image"
                :alt="selectedDeity.name"
                class="modal-darshan-img"
              />
            </div>
            <div class="modal-text-col">
              <span v-if="selectedDeity.subtitle" class="modal-subtitle">
                {{ selectedDeity.subtitle }}
              </span>
              <h2 class="modal-name">{{ selectedDeity.name }}</h2>
              <div class="modal-divider" aria-hidden="true"></div>
              <p class="modal-desc">{{ selectedDeity.description }}</p>

              <div class="modal-actions">
                <NuxtLink
                  to="/puja-list-and-charges"
                  class="btn-primary-action"
                  @click="closeDarshan"
                >
                  Book Puja Offering
                </NuxtLink>
                <button
                  type="button"
                  class="btn-secondary-action"
                  @click="closeDarshan"
                >
                  Return to Deities
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ----------------------------------------------------
   DEITIES PAGE - MINIMAL, REFINED & POLISHED DESIGN
   Color tokens respect both Palette A & Palette B.
   ---------------------------------------------------- */
.deities-page {
  width: 100%;
  min-height: 85vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding-top: calc(var(--nav-height, 72px) + 2rem);
  padding-bottom: 5rem;
}

/* ====================================================
   1. HERO HEADER
   ==================================================== */
.deities-hero {
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

/* ====================================================
   2. MAIN CONTAINER & GRID
   ==================================================== */
.deities-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 0;
}

.loading-state {
  text-align: center;
  padding: 4rem 1rem;
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

.deities-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 4rem;
}

@media (min-width: 640px) {
  .deities-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
}

@media (min-width: 1024px) {
  .deities-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2.25rem;
  }
}

/* ====================================================
   DEITY CARD (Polished, Clean & Minimal)
   ==================================================== */
.deity-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.deity-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.06);
}

html[data-theme="dark"] .deity-card:hover,
html.dark .deity-card:hover {
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.35);
}

.card-media {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.04);
}

.deity-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 25%;
  transition: transform 0.4s ease;
  display: block;
}

.card-media:hover .deity-image {
  transform: scale(1.04);
}

.media-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.45) 0%, transparent 60%);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 1rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.card-media:hover .media-overlay {
  opacity: 1;
}

.view-darshan-badge {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.65);
  padding: 0.3rem 0.65rem;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

.card-body {
  padding: 1.6rem 1.6rem 1.75rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.deity-subtitle {
  font-size: 0.775rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent-text);
  margin-bottom: 0.45rem;
  display: block;
}

.deity-name {
  font-family: var(--font-serif);
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.75rem;
  line-height: 1.25;
}

.deity-desc {
  font-size: 0.925rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 0 1.5rem;
  flex: 1;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.btn-darshan-link {
  flex: 1;
  padding: 0.55rem 0.85rem;
  font-size: 0.825rem;
  font-weight: 600;
  text-align: center;
  color: var(--text-primary);
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-darshan-link:hover {
  background-color: var(--nav-hover-bg);
  border-color: var(--accent);
  color: var(--accent-text);
}

.btn-puja-link {
  flex: 1;
  padding: 0.55rem 0.85rem;
  font-size: 0.825rem;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  color: var(--btn-primary-text);
  background-color: var(--btn-primary-bg);
  border: 1px solid var(--btn-primary-bg);
  border-radius: 8px;
  transition: all 0.15s ease;
}

.btn-puja-link:hover {
  background-color: var(--btn-primary-hover);
  border-color: var(--btn-primary-hover);
}

/* ====================================================
   3. BOTTOM PEACEFUL DARSHAN NOTICE
   ==================================================== */
.darshan-info-card {
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
  .darshan-info-card {
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
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-block;
  text-align: center;
  font-family: inherit;
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
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-block;
  text-align: center;
  font-family: inherit;
}

.btn-secondary-action:hover {
  background-color: var(--nav-hover-bg);
  border-color: var(--accent);
}

/* ====================================================
   4. LIGHTBOX / EXPANDED DARSHAN MODAL
   ==================================================== */
.darshan-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: rgba(14, 10, 20, 0.78);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.darshan-modal-box {
  position: relative;
  width: 100%;
  max-width: 820px;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35);
  animation: modalFadeIn 0.25s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-close-button {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.modal-close-button:hover {
  background-color: var(--accent);
  color: #ffffff;
  border-color: var(--accent);
}

.modal-layout {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 720px) {
  .modal-layout {
    grid-template-columns: 360px 1fr;
  }
}

.modal-image-col {
  width: 100%;
  height: 320px;
  background-color: #000;
}

@media (min-width: 720px) {
  .modal-image-col {
    height: 100%;
    min-height: 440px;
  }
}

.modal-darshan-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 25%;
  display: block;
}

.modal-text-col {
  padding: 2.25rem 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.modal-subtitle {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-text);
  margin-bottom: 0.4rem;
  display: block;
}

.modal-name {
  font-family: var(--font-serif);
  font-size: clamp(1.6rem, 2.5vw, 2.1rem);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem;
}

.modal-divider {
  width: 44px;
  height: 2px;
  background: var(--accent);
  margin-bottom: 1.25rem;
}

.modal-desc {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-secondary);
  margin: 0 0 2rem;
}

.modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
