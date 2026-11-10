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

const { donationData } = useTempleData();
</script>

<template>
  <!-- ================================================================= -->
  <!-- VARIANT 1: CLASSIC (Centered Trust & Offering Card Layout)        -->
  <!-- ================================================================= -->
  <section
    v-if="variant === 'classic'"
    id="donation-section"
    class="donation-section"
    aria-label="Temple Donation and Seva Support"
  >
    <div class="donation-container">
      <span class="section-badge">{{ donationData.badge }}</span>
      <h2 class="donation-title">
        {{ donationData.title }} <span class="title-highlight-inline">{{ donationData.titleHighlight }}</span>
      </h2>
      <p class="donation-subtitle">
        {{ donationData.subtitle }}
      </p>

      <div class="donation-actions">
        <NuxtLink :to="donationData.firstCtaLink" class="btn btn-primary">
          <span>{{ donationData.firstCtaText }}</span>
          <svg class="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </NuxtLink>
        <NuxtLink :to="donationData.secondCtaLink" class="btn btn-secondary">
          <span>{{ donationData.secondCtaText }}</span>
        </NuxtLink>
      </div>

      <div class="donation-trust-badge">
        <svg class="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>{{ donationData.trustBadge }}</span>
      </div>
    </div>
  </section>

  <!-- ================================================================= -->
  <!-- VARIANT 2: KESARI (Wide Architectural Banner Layout)              -->
  <!-- ================================================================= -->
  <section
    v-else
    id="alt-donation"
    class="alt-section"
    aria-label="Temple Donation and Seva Support"
  >
    <div class="alt-container">
      <div class="donation-banner">
        <div class="banner-left">
          <span class="kesari-badge">{{ donationData.badge }}</span>
          <h2 class="banner-title">
            {{ donationData.title }} <span class="kesari-highlight-inline">{{ donationData.titleHighlight }}</span>
          </h2>
          <p class="banner-desc">
            {{ donationData.subtitle }}
          </p>
          <div class="trust-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="trust-icon">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>{{ donationData.trustBadge }}</span>
          </div>
        </div>

        <div class="banner-right">
          <NuxtLink :to="donationData.firstCtaLink" class="btn btn-kesari btn-banner">
            <span>{{ donationData.firstCtaText }}</span>
            <svg class="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </NuxtLink>
          <NuxtLink :to="donationData.secondCtaLink" class="banner-sublink">
            <span>{{ donationData.secondCtaText }} &rarr;</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ----------------------------------------------------
   CLASSIC DONATION STYLES (Layout 1)
---------------------------------------------------- */
.donation-section {
  width: 100%;
  padding: 6.5rem 1.5rem;
  background-color: var(--bg-primary);
  position: relative;
}

.donation-container {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 4rem 2.5rem;
}

@media (max-width: 640px) {
  .donation-section,
  .alt-section {
    padding: 4rem 1.25rem;
  }

  .donation-container {
    padding: 2.25rem 1.25rem;
    border-radius: 18px;
  }

  .donation-actions {
    flex-direction: column;
    width: 100%;
    gap: 0.75rem;
  }

  .donation-actions .btn {
    width: 100%;
  }
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
  margin-bottom: 1.15rem;
}

.donation-title {
  font-size: clamp(1.85rem, 3.4vw, 2.85rem);
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.025em;
  color: var(--text-primary);
  margin-top: 0.5rem;
  margin-bottom: 1.15rem;
}

.title-highlight-inline {
  color: var(--accent-text);
}

.donation-subtitle {
  font-size: clamp(0.95rem, 1.35vw, 1.1rem);
  color: var(--text-secondary);
  line-height: 1.65;
  max-width: 620px;
  margin-bottom: 2.25rem;
}

.donation-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2.25rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.8rem 1.75rem;
  border-radius: 9999px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: inherit;
}

.btn-primary {
  background: var(--btn-cta-bg, var(--accent));
  color: var(--btn-cta-text, #3F0A12);
  box-shadow: 0 6px 20px var(--accent-glow);
  border: 1px solid var(--btn-cta-bg, var(--accent));
  font-weight: 700;
}

.btn-primary:hover {
  background: var(--btn-cta-hover, var(--accent-light));
  border-color: var(--btn-cta-hover, var(--accent-light));
  transform: translateY(-2px);
  box-shadow: 0 10px 26px var(--accent-glow);
}

.btn-secondary {
  background: var(--action-btn-bg);
  color: var(--text-primary);
  border: 1.5px solid var(--border-color);
  font-weight: 600;
}

.btn-secondary:hover {
  background: var(--action-btn-hover);
  border-color: var(--accent);
  color: var(--color-on-brand, #F7EFE0);
  transform: translateY(-2px);
}

.btn-arrow {
  width: 17px;
  height: 17px;
  transition: transform 0.2s ease;
}

.btn-primary:hover .btn-arrow,
.btn-kesari:hover .btn-arrow {
  transform: translateX(3px);
}

.donation-trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.trust-icon {
  width: 18px;
  height: 18px;
  color: var(--accent);
}

/* ----------------------------------------------------
   KESARI DONATION STYLES (Layout 2)
---------------------------------------------------- */
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

.donation-banner {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 3.5rem 3rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  align-items: center;
}

@media (max-width: 640px) {
  .donation-banner {
    padding: 2.25rem 1.25rem;
    border-radius: 18px;
    gap: 1.75rem;
  }

  .banner-right {
    width: 100%;
    align-items: center !important;
  }

  .banner-right .btn-banner {
    width: 100%;
    text-align: center;
  }
}

@media (min-width: 900px) {
  .donation-banner {
    grid-template-columns: 1.35fr 0.65fr;
    gap: 3.5rem;
  }
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

.banner-title {
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin: 0.85rem 0 1rem;
}

.kesari-highlight-inline {
  color: var(--kesari, #ea580c);
}

.banner-desc {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.75rem;
  max-width: 600px;
}

.trust-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.banner-right {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

@media (min-width: 900px) {
  .banner-right {
    align-items: flex-end;
  }
}

.btn-kesari {
  background: var(--kesari, #ea580c);
  color: #ffffff;
  border: 1px solid var(--kesari, #ea580c);
  box-shadow: 0 6px 20px rgba(234, 88, 12, 0.35);
}

.btn-kesari:hover {
  background: var(--kesari-light, #fb923c);
  transform: translateY(-2px);
  box-shadow: 0 10px 26px rgba(234, 88, 12, 0.45);
}

.btn-banner {
  padding: 0.95rem 2.25rem;
  font-size: 1rem;
}

.banner-sublink {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--kesari, #ea580c);
  text-decoration: none;
  transition: transform 0.15s ease;
}

.banner-sublink:hover {
  transform: translateX(3px);
}
</style>
