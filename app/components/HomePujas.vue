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

const { pujaOfferings } = useTempleData();
</script>

<template>
  <!-- ================================================================= -->
  <!-- VARIANT 1: CLASSIC (Clean, Linear List Layout with Meta Columns)   -->
  <!-- ================================================================= -->
  <section
    v-if="variant === 'classic'"
    id="puja-offerings"
    class="puja-section"
    aria-label="Puja Offerings in Your Name"
  >
    <div class="puja-container">
      <!-- Section Header -->
      <div class="puja-header">
        <span class="section-badge">Puja & Rituals</span>
        <h2 class="section-title">Offerings in your name</h2>
        <p class="section-subtitle">
          Each puja is performed by the temple priests with your name and gotra read in the sankalpa. Sample charges, confirmed by the office.
        </p>
      </div>

      <!-- Clean, Professional Puja List -->
      <div class="puja-list">
        <article
          v-for="puja in pujaOfferings"
          :key="puja.id"
          class="puja-row"
        >
          <!-- Number Column -->
          <div class="puja-num-col">
            <span class="puja-num">{{ puja.number }}</span>
          </div>

          <!-- Content Column -->
          <div class="puja-body-col">
            <div class="puja-title-row">
              <h3 class="puja-title">{{ puja.title }}</h3>
              <div class="puja-meta-mobile">
                <span class="puja-price">{{ puja.price }}</span>
                <span class="puja-meta-sep">•</span>
                <span class="puja-duration">{{ puja.duration }}</span>
              </div>
            </div>

            <div class="puja-offered-box">
              <span class="offered-label">Offered</span>
              <span class="offered-text">{{ puja.offered }}</span>
            </div>
          </div>

          <!-- Price & Duration Column (Desktop) -->
          <div class="puja-meta-col">
            <span class="puja-price">{{ puja.price }}</span>
            <span class="puja-duration">{{ puja.duration }}</span>
          </div>
        </article>
      </div>

      <!-- Section Footer Note & Action -->
      <div class="puja-footer">
        <p class="puja-office-note">
          Special pujas, Havans, and festival dates can also be requested through the temple office.
        </p>
        <NuxtLink to="/puja-list-and-charges" class="btn btn-secondary">
          <span>View Full Puja List & Charges</span>
          <svg class="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>

  <!-- ================================================================= -->
  <!-- VARIANT 2: KESARI (2x2 Architectural Quad-Grid Layout)            -->
  <!-- ================================================================= -->
  <section
    v-else
    id="alt-pujas"
    class="alt-section"
    aria-label="Puja Offerings in Your Name"
  >
    <div class="alt-container">
      <div class="section-heading-split">
        <div>
          <span class="kesari-badge">Sankalpa Puja</span>
          <h2 class="section-title">Offerings in your name</h2>
        </div>
        <p class="section-subtitle-compact">
          Each puja is performed by the temple priests with your name and gotra read in the sankalpa. Sample charges, confirmed by the office.
        </p>
      </div>

      <div class="puja-quad-grid">
        <article
          v-for="puja in pujaOfferings"
          :key="puja.id"
          class="puja-quad-card"
        >
          <div class="quad-head">
            <span class="quad-num">{{ puja.number }}</span>
            <div class="quad-pricing">
              <span class="quad-price">{{ puja.price }}</span>
              <span class="quad-duration">{{ puja.duration }}</span>
            </div>
          </div>

          <h3 class="quad-title">{{ puja.title }}</h3>

          <div class="quad-offered">
            <span class="quad-offered-label">Offered:</span>
            <span class="quad-offered-text">{{ puja.offered }}</span>
          </div>
        </article>
      </div>

      <div class="puja-bottom-row">
        <p class="office-hint">
          Special pujas, Havans, and festival dates can also be requested through the temple office.
        </p>
        <NuxtLink to="/puja-list-and-charges" class="btn btn-outline-kesari">
          <span>View Full Puja List & Charges</span>
          <svg class="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ----------------------------------------------------
   CLASSIC PUJA STYLES (Layout 1)
---------------------------------------------------- */
.puja-section {
  width: 100%;
  padding: 6.5rem 1.5rem;
  background-color: var(--bg-primary);
  position: relative;
}

.puja-container {
  max-width: 1100px;
  margin: 0 auto;
}

.puja-header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 3.5rem;
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

.section-title {
  font-size: clamp(1.85rem, 3.2vw, 2.75rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.025em;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.65;
  margin: 0;
}

.puja-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.puja-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.65rem 1.85rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.puja-row:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.puja-num-col {
  width: 44px;
  flex-shrink: 0;
}

.puja-num {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--accent-text);
  letter-spacing: -0.02em;
}

.puja-body-col {
  flex: 1;
}

.puja-title-row {
  display: flex;
  align-items: baseline;
  gap: 0.85rem;
  margin-bottom: 0.5rem;
}

.puja-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.puja-meta-mobile {
  display: none;
}

@media (max-width: 768px) {
  .puja-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.35rem 1.25rem;
  }

  .puja-meta-col {
    display: none !important;
  }

  .puja-meta-mobile {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
  }

  .puja-meta-sep {
    color: var(--border-color);
  }
}

.puja-offered-box {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.offered-label {
  font-weight: 700;
  color: var(--text-primary);
  text-transform: uppercase;
  font-size: 0.725rem;
  letter-spacing: 0.05em;
}

.puja-meta-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  min-width: 130px;
}

.puja-price {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--accent-text);
  letter-spacing: -0.02em;
}

.puja-duration {
  font-size: 0.825rem;
  color: var(--text-muted);
}

.puja-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  margin-top: 3.5rem;
  text-align: center;
}

.puja-office-note {
  font-size: 0.95rem;
  color: var(--text-muted);
  max-width: 580px;
  margin: 0;
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

.btn-secondary {
  background: var(--action-btn-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
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

.btn-secondary:hover .btn-arrow,
.btn-outline-kesari:hover .btn-arrow {
  transform: translateX(3px);
}

/* ----------------------------------------------------
   KESARI PUJA STYLES (Layout 2)
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

.section-heading-split {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 3.5rem;
}

@media (min-width: 800px) {
  .section-heading-split {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
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

.section-subtitle-compact {
  max-width: 480px;
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.puja-quad-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .puja-quad-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.75rem;
  }
}

.puja-quad-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2.25rem 2rem;
  transition: transform 0.2s ease, border-color 0.2s ease;
  display: flex;
  flex-direction: column;
}

.puja-quad-card:hover {
  transform: translateY(-4px);
  border-color: var(--kesari, #ea580c);
}

.quad-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.quad-num {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--kesari, #ea580c);
  letter-spacing: -0.03em;
}

.quad-pricing {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.quad-price {
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.quad-duration {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.quad-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 1rem;
  letter-spacing: -0.015em;
}

.quad-offered {
  background: var(--nav-hover-bg);
  padding: 0.85rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-top: auto;
}

.quad-offered-label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--kesari, #ea580c);
  letter-spacing: 0.05em;
}

.quad-offered-text {
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .puja-section,
  .alt-section {
    padding: 4rem 1.25rem;
  }

  .puja-header,
  .section-heading-split {
    margin-bottom: 2.25rem;
  }

  .puja-quad-card {
    padding: 1.5rem 1.25rem;
  }

  .puja-footer,
  .puja-bottom-row {
    margin-top: 2.25rem;
  }

  .puja-footer .btn,
  .puja-bottom-row .btn {
    width: 100%;
  }
}

.puja-bottom-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  margin-top: 3.5rem;
  text-align: center;
}

.office-hint {
  font-size: 0.95rem;
  color: var(--text-muted);
  margin: 0;
}

.btn-outline-kesari {
  background: var(--action-btn-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  backdrop-filter: blur(8px);
}

.btn-outline-kesari:hover {
  border-color: var(--kesari, #ea580c);
  background: var(--action-btn-hover);
  transform: translateY(-2px);
}
</style>
