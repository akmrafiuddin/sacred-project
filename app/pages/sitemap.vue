<script setup lang="ts">
import { ref, computed } from "vue";
import { sitemapCategories, type SitemapCategory } from "~/../shared/constants/sitemap";

// Search / filter state
const searchQuery = ref("");

// Filter categories and links based on search term
const filteredCategories = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return sitemapCategories;

  return sitemapCategories
    .map((category) => {
      const categoryMatches =
        category.title.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query);

      const matchedLinks = category.links.filter(
        (link) =>
          categoryMatches ||
          link.title.toLowerCase().includes(query) ||
          link.path.toLowerCase().includes(query) ||
          link.description.toLowerCase().includes(query) ||
          (link.badge && link.badge.toLowerCase().includes(query))
      );

      if (matchedLinks.length === 0) return null;

      return {
        ...category,
        links: matchedLinks,
      };
    })
    .filter((cat): cat is SitemapCategory => cat !== null);
});

// Total link count calculation
const totalLinksCount = computed(() => {
  return sitemapCategories.reduce((acc, cat) => acc + cat.links.length, 0);
});

const filteredLinksCount = computed(() => {
  return filteredCategories.value.reduce((acc, cat) => acc + cat.links.length, 0);
});

const clearSearch = () => {
  searchQuery.value = "";
};

useHead({
  title: "Sitemap - Golpahar Mohashoshan Kali Mandir",
  meta: [
    {
      name: "description",
      content:
        "Complete sitemap of Golpahar Mohashoshan Kali Mandir. Browse all temple pages, daily puja schedules, devotee booking services, festivals, and sacred heritage resources.",
    },
    { property: "og:title", content: "Sitemap - Golpahar Mohashoshan Kali Mandir" },
    {
      property: "og:description",
      content:
        "Explore all pages, daily ritual schedules, and online booking portals for Golpahar Kali Mandir.",
    },
  ],
});
</script>

<template>
  <div class="sitemap-page" lang="en">
    <!-- PAGE HERO -->
    <header class="sitemap-hero">
      <div class="hero-inner">
        <span class="hero-badge">Site Directory</span>
        <h1 class="hero-title">Temple Sitemap</h1>
        <p class="hero-subtitle">
          A clear, complete guide to all sacred pages, daily worship schedules, puja bookings, and devotee resources.
        </p>
        <div class="hero-divider" aria-hidden="true"></div>
      </div>
    </header>

    <main class="sitemap-container">
      <!-- SEARCH / FILTER CONTROL -->
      <section class="search-section" aria-label="Search pages">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clip-rule="evenodd"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Search pages, rituals, offerings, or services..."
            aria-label="Filter sitemap links"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="clear-btn"
            aria-label="Clear search"
            @click="clearSearch"
          >
            &times;
          </button>
        </div>

        <div class="results-meta">
          <span v-if="searchQuery">
            Found {{ filteredLinksCount }} of {{ totalLinksCount }} pages
          </span>
          <span v-else>
            {{ totalLinksCount }} public pages and services available
          </span>
        </div>
      </section>

      <!-- EMPTY STATE -->
      <div v-if="filteredCategories.length === 0" class="empty-state" role="status">
        <div class="empty-icon" aria-hidden="true">🔍</div>
        <h2 class="empty-heading">No matching pages found</h2>
        <p class="empty-text">
          We could not find any pages matching &ldquo;{{ searchQuery }}&rdquo;. Try searching with a different keyword or view all pages.
        </p>
        <button type="button" class="btn-reset" @click="clearSearch">
          Reset Filter
        </button>
      </div>

      <!-- SITEMAP CATEGORIES GRID -->
      <div v-else class="categories-grid">
        <section
          v-for="category in filteredCategories"
          :key="category.id"
          class="category-card"
          :aria-labelledby="`cat-${category.id}`"
        >
          <div class="card-header">
            <h2 :id="`cat-${category.id}`" class="category-title">
              {{ category.title }}
            </h2>
            <p class="category-desc">{{ category.description }}</p>
          </div>

          <ul class="links-list">
            <li v-for="link in category.links" :key="link.path" class="link-item">
              <NuxtLink :to="link.path" class="link-anchor">
                <div class="link-main">
                  <div class="link-top-row">
                    <span class="link-title">{{ link.title }}</span>
                    <span v-if="link.badge" class="link-badge">{{ link.badge }}</span>
                  </div>
                  <p class="link-description">{{ link.description }}</p>
                  <span class="link-path">{{ link.path }}</span>
                </div>
                <div class="link-arrow" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>

      <!-- DEVOTEE QUICK ASSISTANCE CARD -->
      <aside class="assistance-card" aria-label="Devotee Assistance">
        <div class="assistance-content">
          <div class="assistance-text">
            <h3 class="assistance-title">Looking for Devotee Services?</h3>
            <p class="assistance-desc">
              Book a sacred puja, check your booking confirmation, or contact the temple office directly for pilgrimage guidance.
            </p>
          </div>
          <div class="assistance-actions">
            <NuxtLink to="/puja-booking" class="btn-action primary">
              Book a Puja
            </NuxtLink>
            <NuxtLink to="/booking-status" class="btn-action secondary">
              Check Status
            </NuxtLink>
            <NuxtLink to="/contact" class="btn-action outline">
              Contact Desk
            </NuxtLink>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
/* ====================================================
   SITEMAP PAGE LAYOUT & HERO
   ==================================================== */
.sitemap-page {
  min-height: 80vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding-bottom: 5rem;
}

.sitemap-hero {
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  padding: 4.5rem 1.5rem 2.5rem;
  text-align: center;
  border-bottom: 1px solid var(--border-subtle);
}

.hero-inner {
  max-width: 760px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-block;
  padding: 0.3rem 0.9rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-brand);
  background: rgba(110, 5, 22, 0.08);
  border: 1px solid rgba(110, 5, 22, 0.2);
  border-radius: 9999px;
  margin-bottom: 1rem;
}

:global(.dark) .hero-badge {
  color: var(--accent);
  background: rgba(224, 165, 38, 0.12);
  border-color: rgba(224, 165, 38, 0.3);
}

.hero-title {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  color: var(--color-brand);
  margin: 0 0 0.85rem;
  letter-spacing: -0.01em;
}

:global(.dark) .hero-title {
  color: #FFFFFF;
}

.hero-subtitle {
  font-family: var(--font-sans);
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 auto 1.5rem;
  max-width: 600px;
}

.hero-divider {
  width: 56px;
  height: 3px;
  background-color: var(--accent);
  margin: 0 auto;
  border-radius: 2px;
}

/* ====================================================
   MAIN CONTAINER & SEARCH
   ==================================================== */
.sitemap-container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 0;
}

.search-section {
  max-width: 640px;
  margin: 0 auto 2.5rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  width: 1.15rem;
  height: 1.15rem;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.85rem 2.75rem 0.85rem 2.85rem;
  font-size: 0.95rem;
  font-family: var(--font-sans);
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-primary);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px rgba(110, 5, 22, 0.12);
}

:global(.dark) .search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(224, 165, 38, 0.2);
}

.clear-btn {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  font-size: 1.35rem;
  line-height: 1;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.clear-btn:hover {
  color: var(--text-primary);
}

.results-meta {
  text-align: center;
  font-size: 0.825rem;
  color: var(--text-muted);
  margin-top: 0.65rem;
}

/* ====================================================
   CATEGORIES GRID & CARDS
   ==================================================== */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.75rem;
  margin-bottom: 3.5rem;
}

@media (max-width: 860px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
}

.category-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.category-card:hover {
  border-color: var(--border-color);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
}

.card-header {
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 1rem;
  margin-bottom: 1.25rem;
}

.category-title {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-brand);
  margin: 0 0 0.35rem;
}

:global(.dark) .category-title {
  color: var(--accent);
}

.category-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.45;
  margin: 0;
}

/* ====================================================
   LINKS LIST
   ==================================================== */
.links-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  flex: 1;
}

.link-item {
  display: flex;
}

.link-anchor {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  background-color: transparent;
  border: 1px solid transparent;
  transition: all 0.15s ease-in-out;
}

.link-anchor:hover {
  background-color: var(--bg-secondary);
  border-color: var(--border-subtle);
}

.link-main {
  flex: 1;
  min-width: 0;
}

.link-top-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.link-title {
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  transition: color 0.15s ease;
}

.link-anchor:hover .link-title {
  color: var(--color-brand);
}

:global(.dark) .link-anchor:hover .link-title {
  color: var(--accent);
}

.link-badge {
  font-size: 0.675rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background-color: rgba(224, 165, 38, 0.18);
  color: #8c6200;
}

:global(.dark) .link-badge {
  background-color: rgba(224, 165, 38, 0.2);
  color: var(--accent-light);
}

.link-description {
  font-size: 0.825rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0 0 0.3rem;
}

.link-path {
  display: inline-block;
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.link-arrow {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-muted);
  margin-left: 0.75rem;
  flex-shrink: 0;
  transition: transform 0.15s ease, color 0.15s ease;
}

.link-anchor:hover .link-arrow {
  transform: translateX(3px);
  color: var(--color-brand);
}

:global(.dark) .link-anchor:hover .link-arrow {
  color: var(--accent);
}

/* ====================================================
   EMPTY STATE
   ==================================================== */
.empty-state {
  text-align: center;
  padding: 3.5rem 1.5rem;
  background-color: var(--bg-card);
  border: 1px dashed var(--border-color);
  border-radius: 12px;
  margin-bottom: 3.5rem;
}

.empty-icon {
  font-size: 2.25rem;
  margin-bottom: 0.75rem;
}

.empty-heading {
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.empty-text {
  font-size: 0.95rem;
  color: var(--text-secondary);
  max-width: 480px;
  margin: 0 auto 1.5rem;
  line-height: 1.5;
}

.btn-reset {
  display: inline-flex;
  align-items: center;
  padding: 0.65rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-brand);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-reset:hover {
  background-color: var(--accent-glow);
}

/* ====================================================
   ASSISTANCE BANNER
   ==================================================== */
.assistance-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem 2.25rem;
  margin-top: 1rem;
}

.assistance-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.assistance-text {
  flex: 1;
  min-width: 260px;
}

.assistance-title {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-brand);
  margin: 0 0 0.35rem;
}

:global(.dark) .assistance-title {
  color: var(--accent);
}

.assistance-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.45;
}

.assistance-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 1.15rem;
  font-size: 0.875rem;
  font-weight: 700;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.btn-action.primary {
  background-color: var(--color-brand);
  color: #FFFFFF;
}

.btn-action.primary:hover {
  background-color: var(--color-brand-deep);
}

:global(.dark) .btn-action.primary {
  background-color: var(--accent);
  color: #1A0D00;
}

:global(.dark) .btn-action.primary:hover {
  background-color: var(--accent-light);
}

.btn-action.secondary {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-action.secondary:hover {
  background-color: var(--border-color);
}

.btn-action.outline {
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.btn-action.outline:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

@media (max-width: 600px) {
  .sitemap-hero {
    padding: 3.5rem 1rem 2rem;
  }

  .sitemap-container {
    padding: 1.75rem 1rem 0;
  }

  .category-card {
    padding: 1.25rem;
  }

  .assistance-card {
    padding: 1.5rem;
  }

  .assistance-actions {
    width: 100%;
  }

  .btn-action {
    flex: 1;
    min-width: 120px;
    text-align: center;
  }
}
</style>
