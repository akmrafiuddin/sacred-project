<script setup lang="ts">
import { useTempleDataFast } from "~/composables/useTempleDataFast";

const props = withDefaults(
  defineProps<{
    variant?: "classic" | "kesari";
  }>(),
  {
    variant: "classic",
  }
);

const { heroData } = useTempleDataFast();

const scrollToNext = () => {
  if (typeof window !== "undefined") {
    const nextSection = document.getElementById(
      props.variant === "kesari" ? "alt-schedule" : "daily-schedule"
    );
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  }
};
</script>

<template>
  <!-- ================================================================= -->
  <!-- VARIANT 1: CLASSIC (Centered Single Column, Golden Accents)      -->
  <!-- ================================================================= -->
  <section
    v-if="variant === 'classic'"
    class="hero-section"
    aria-label="Temple Hero Section"
  >
    <!-- Background Ambient Layers (Solid background, no gradients) -->
    <div class="hero-bg-layer" aria-hidden="true"></div>

    <!-- Main Center Content -->
    <div class="hero-content">
      <!-- 1. SCHEDULE MESSAGE -->
      <div class="schedule-card" role="status" aria-label="Temple Schedule Notice">
        <div class="schedule-badge-wrap">
          <span class="live-pulse" aria-hidden="true">
            <span class="pulse-ring"></span>
            <span class="pulse-dot"></span>
          </span>
          <span class="schedule-tag">NEXT</span>
        </div>
        <div class="schedule-info">
          <span class="schedule-title">{{ heroData.scheduleTitle }}</span>
          <span class="schedule-sep">•</span>
          <span class="schedule-time">{{ heroData.scheduleTime }}</span>
        </div>
      </div>

      <!-- 2. MAIN HEADING -->
      <h1 class="hero-title">
        {{ heroData.titleLine1 }}
        <span class="title-highlight">{{ heroData.titleHighlight }}</span>
      </h1>

      <!-- 3. SUBTITLE -->
      <p class="hero-paragraph">
        {{ heroData.subtitle }}
      </p>

      <!-- 4. ACTION BUTTONS -->
      <div class="hero-actions">
        <NuxtLink :to="heroData.firstCtaLink" class="btn btn-primary">
          <span>{{ heroData.firstCtaText }}</span>
          <svg class="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </NuxtLink>

        <NuxtLink :to="heroData.secondCtaLink" class="btn btn-secondary">
          <span>{{ heroData.secondCtaText }}</span>
          <svg class="btn-icon-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </NuxtLink>
      </div>
    </div>

    <!-- 5. SCROLLER ICON -->
    <div class="hero-scroller">
      <button
        type="button"
        class="scroller-btn"
        @click="scrollToNext"
        aria-label="Scroll down to explore daily schedule"
      >
        <span class="scroller-mouse">
          <span class="scroller-wheel"></span>
        </span>
        <svg class="scroller-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 10l5 5 5-5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </section>

  <!-- ================================================================= -->
  <!-- VARIANT 2: KESARI (Split-Screen, Sanctum Showcase, Saffron Aura)  -->
  <!-- ================================================================= -->
  <section
    v-else
    class="alt-hero-section"
    aria-label="Temple Hero Section"
  >
    <div class="alt-hero-container">
      <!-- Left: Headline, Badge, Text & Actions -->
      <div class="alt-hero-content">
        <!-- Next Aarti Pill -->
        <div class="alt-schedule-badge">
          <span class="live-dot" aria-hidden="true"></span>
          <span class="badge-label">NEXT RITUAL</span>
          <span class="badge-sep">•</span>
          <span class="badge-event">{{ heroData.scheduleTitle }} • {{ heroData.scheduleTime }}</span>
        </div>

        <h1 class="alt-hero-title">
          {{ heroData.titleLine1 }}
          <span class="kesari-highlight">{{ heroData.titleHighlight }}</span>
        </h1>

        <p class="alt-hero-desc">
          {{ heroData.subtitle }}
        </p>

        <div class="alt-hero-actions">
          <NuxtLink :to="heroData.firstCtaLink" class="btn btn-kesari">
            <span>{{ heroData.firstCtaText }}</span>
            <svg class="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </NuxtLink>

          <NuxtLink :to="heroData.secondCtaLink" class="btn btn-outline-kesari">
            <span>{{ heroData.secondCtaText }}</span>
            <svg class="btn-icon-right kesari-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </NuxtLink>
        </div>
      </div>

      <!-- Right: Sacred Sanctum Showcase Emblem -->
      <div class="alt-hero-visual" aria-hidden="true">
        <div class="shrine-card">
          <div class="shrine-img-wrap">
            <img
              src="/images/optimized/shiva.jpg" width="600" height="750" decoding="async"
              alt="Presiding Sanctum Deity"
              class="shrine-img"
            />
            <div class="shrine-glow"></div>
          </div>
          <div class="shrine-caption">
            <div class="shrine-status">
              <span class="status-beacon"></span>
              <span>Sanctum Open • Live Darshan Active</span>
            </div>
            <h3 class="shrine-title">Golpahar Mohashoshan</h3>
            <p class="shrine-desc">Maa Kali Sanctum • Chittagong</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Scroller Icon for Kesari Variant -->
    <div class="alt-hero-scroller">
      <button
        type="button"
        class="scroller-btn alt-scroller-btn"
        @click="scrollToNext"
        aria-label="Scroll down to explore daily schedule"
      >
        <span class="scroller-mouse">
          <span class="scroller-wheel"></span>
        </span>
        <svg class="scroller-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 10l5 5 5-5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </section>
</template>

<style scoped>
/* ----------------------------------------------------
   CLASSIC HERO STYLES (Layout 1)
---------------------------------------------------- */
.hero-section {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 560px;
  margin-top: calc(-1 * var(--nav-height, 72px));
  padding-top: var(--nav-height, 72px);
  padding-bottom: 2rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: var(--bg-primary);
  box-sizing: border-box;
}

@media (max-width: 640px) {
  .hero-section {
    height: auto;
    min-height: 100dvh;
    padding-top: calc(var(--nav-height, 64px) + 1.75rem);
    padding-bottom: 4rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

.hero-bg-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Schedule Notification Pill */
.schedule-card {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.35rem 0.95rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  margin-bottom: 1.5rem;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

@media (max-width: 480px) {
  .schedule-card {
    max-width: 100%;
    flex-wrap: wrap;
    justify-content: center;
    text-align: center;
    border-radius: 14px;
    padding: 0.4rem 0.85rem;
  }
}

.schedule-card:hover {
  transform: translateY(-1px);
  border-color: var(--accent);
}

.schedule-badge-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.live-pulse {
  position: relative;
  width: 8px;
  height: 8px;
  display: inline-flex;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
}

.pulse-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.45);
  animation: pulsePing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes pulsePing {
  75%, 100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

.schedule-tag {
  font-size: 0.685rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--accent-text);
  text-transform: uppercase;
}

.schedule-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
}

.schedule-title {
  color: var(--text-primary);
  font-weight: 600;
}

.schedule-sep {
  color: var(--border-color);
}

.schedule-time {
  color: var(--accent-text);
  font-weight: 600;
}

/* Heading */
.hero-title {
  font-size: clamp(2.15rem, 4.4vw, 3.65rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.035em;
  color: var(--text-primary);
  max-width: 840px;
  margin-bottom: 1rem;
}

.title-highlight {
  display: block;
  color: var(--accent-text);
}

.hero-paragraph {
  font-size: clamp(0.95rem, 1.4vw, 1.125rem);
  color: var(--text-secondary);
  max-width: 640px;
  line-height: 1.65;
  margin-bottom: 1.85rem;
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 540px) {
  .hero-actions {
    flex-direction: column;
    width: 100%;
    gap: 0.75rem;
  }

  .hero-actions .btn {
    width: 100%;
  }
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
  position: relative;
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

.btn-arrow {
  width: 17px;
  height: 17px;
  transition: transform 0.2s ease;
}

.btn-primary:hover .btn-arrow {
  transform: translateX(3px);
}

.btn-secondary {
  background: var(--action-btn-bg);
  color: var(--text-primary);
  border: 1.5px solid var(--border-color);
  backdrop-filter: blur(8px);
  font-weight: 600;
}

.btn-secondary:hover {
  background: var(--action-btn-hover);
  border-color: var(--accent);
  color: var(--color-on-brand, #F7EFE0);
  transform: translateY(-2px);
}

.btn-icon-right {
  width: 17px;
  height: 17px;
  color: var(--accent);
}

/* Scroller Icon */
.hero-scroller {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.scroller-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: var(--text-muted);
  transition: color 0.2s ease, transform 0.2s ease;
}

.scroller-btn:hover {
  color: var(--accent);
  transform: translateY(2px);
}

.scroller-mouse {
  width: 22px;
  height: 34px;
  border: 2px solid currentColor;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  padding-top: 6px;
}

.scroller-wheel {
  width: 3px;
  height: 7px;
  border-radius: 2px;
  background-color: currentColor;
  animation: mouseWheelScroll 1.8s ease-in-out infinite;
}

@keyframes mouseWheelScroll {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  60% {
    transform: translateY(8px);
    opacity: 0.1;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.scroller-chevron {
  width: 16px;
  height: 16px;
}

/* ----------------------------------------------------
   KESARI HERO STYLES (Layout 2)
---------------------------------------------------- */
.alt-hero-section {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 560px;
  margin-top: calc(-1 * var(--nav-height, 72px));
  padding: calc(var(--nav-height, 72px) + 1.25rem) 2rem 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--bg-primary);
  overflow: hidden;
  box-sizing: border-box;
}

@media (max-width: 991px) {
  .alt-hero-section {
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
    padding-top: calc(var(--nav-height, 72px) + 2rem);
    padding-bottom: 4rem;
  }
}

@media (max-width: 640px) {
  .alt-hero-section {
    padding: calc(var(--nav-height, 64px) + 1.25rem) 1rem 3.5rem;
  }

  .alt-hero-actions {
    flex-direction: column;
    width: 100%;
    gap: 0.75rem;
  }

  .alt-hero-actions .btn {
    width: 100%;
  }

  .shrine-img-wrap {
    height: 250px !important;
  }
}

.alt-hero-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  align-items: center;
  position: relative;
  z-index: 2;
}

@media (min-width: 992px) {
  .alt-hero-container {
    grid-template-columns: 1.15fr 0.85fr;
    gap: 3.5rem;
  }
}

.alt-schedule-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  background: var(--bg-card);
  border: 1px solid rgba(234, 88, 12, 0.35);
  border-radius: 9999px;
  font-size: 0.775rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

@media (max-width: 480px) {
  .alt-schedule-badge {
    max-width: 100%;
    flex-wrap: wrap;
    border-radius: 14px;
  }
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ea580c;
  box-shadow: 0 0 10px #ea580c;
}

.badge-label {
  color: #ea580c;
  letter-spacing: 0.08em;
  font-size: 0.725rem;
}

.badge-sep {
  color: var(--border-color);
}

.badge-event {
  color: var(--text-secondary);
  font-weight: 600;
}

.alt-hero-title {
  font-size: clamp(2rem, 3.8vw, 3.25rem);
  font-weight: 900;
  line-height: 1.12;
  letter-spacing: -0.035em;
  color: var(--text-primary);
  margin-bottom: 0.85rem;
}

.kesari-highlight {
  display: block;
  color: var(--kesari, #ea580c);
  filter: none;
}

html[data-theme="light"] .kesari-highlight {
  color: var(--kesari, #ea580c);
}

.alt-hero-desc {
  font-size: clamp(0.925rem, 1.25vw, 1.05rem);
  color: var(--text-secondary);
  line-height: 1.6;
  max-width: 520px;
  margin-bottom: 1.75rem;
}

.alt-hero-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
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

.kesari-icon {
  color: var(--kesari, #ea580c);
}

/* Shrine Visual Card */
.alt-hero-visual {
  display: flex;
  justify-content: center;
}

.shrine-card {
  position: relative;
  width: 100%;
  max-width: 440px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
}

.shrine-img-wrap {
  position: relative;
  width: 100%;
  height: 290px;
  overflow: hidden;
}

.shrine-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
  display: block;
}

.shrine-glow {
  position: absolute;
  inset: 0;
  background: rgba(11, 17, 32, 0.65);
}

.shrine-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.35rem;
}

.shrine-status {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.775rem;
  font-weight: 700;
  color: var(--kesari-light, #fb923c);
  margin-bottom: 0.35rem;
}

.status-beacon {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.shrine-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 0.2rem;
}

.shrine-desc {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

/* Kesari Scroller Icon */
.alt-hero-scroller {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

@media (max-width: 991px) {
  .alt-hero-scroller {
    display: none;
  }
}

.alt-scroller-btn:hover {
  color: var(--kesari, #ea580c);
}
</style>
