<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useTempleData } from "~/composables/useTempleData";

const props = withDefaults(
  defineProps<{
    variant?: "classic" | "kesari";
  }>(),
  {
    variant: "classic",
  }
);

const { heroData } = useTempleData();

// Static Hero Slider Data
interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
  badge: string;
}

const heroSlides: HeroSlide[] = [
  {
    image: "/images/optimized/kali.jpg",
    title: "Maa Bhavatarini Kali",
    subtitle: "Presiding Sanctum Deity • Golpahar Mandir",
    badge: "Primary Sanctum",
  },
  {
    image: "/images/optimized/shiva.jpg",
    title: "Lord Mahadeva Shiva",
    subtitle: "Eternal Consciousness & Auspicious Lingam",
    badge: "Holy Shrine",
  },
  {
    image: "/images/optimized/krishna.jpg",
    title: "Sri Sri Radha Krishna",
    subtitle: "Divine Love & Eternal Bhakti",
    badge: "Sanctum Altar",
  },
  {
    image: "/images/optimized/ganesha.jpg",
    title: "Lord Vighnaharta Ganesha",
    subtitle: "Remover of Obstacles & Bestower of Wisdom",
    badge: "Sacred Darshan",
  },
  {
    image: "/images/optimized/lakshmi.jpg",
    title: "Maa Mahalakshmi",
    subtitle: "Goddess of Prosperity & Auspicious Grace",
    badge: "Holy Shrine",
  },
];

const currentSlideIndex = ref(0);
const isPaused = ref(false);
let autoPlayTimer: ReturnType<typeof setInterval> | null = null;

const defaultSlide: HeroSlide = heroSlides[0]!;
const currentSlide = computed<HeroSlide>(() => heroSlides[currentSlideIndex.value] ?? defaultSlide);

const nextSlide = () => {
  currentSlideIndex.value = (currentSlideIndex.value + 1) % heroSlides.length;
};

const prevSlide = () => {
  currentSlideIndex.value = (currentSlideIndex.value - 1 + heroSlides.length) % heroSlides.length;
};

const goToSlide = (index: number) => {
  if (index >= 0 && index < heroSlides.length) {
    currentSlideIndex.value = index;
  }
};

const pauseSlider = () => {
  isPaused.value = true;
};

const resumeSlider = () => {
  isPaused.value = false;
};

// Touch swipe support
let touchStartX = 0;
let touchEndX = 0;

const handleTouchStart = (e: TouchEvent) => {
  if (e.changedTouches[0]) {
    touchStartX = e.changedTouches[0].screenX;
  }
};

const handleTouchEnd = (e: TouchEvent) => {
  if (e.changedTouches[0]) {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }
};

onMounted(() => {
  autoPlayTimer = setInterval(() => {
    if (!isPaused.value) {
      nextSlide();
    }
  }, 5000);
});

onBeforeUnmount(() => {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
});

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
  <!-- VARIANT 1: CLASSIC (Side-by-Side on Desktop, Vertical Responsive)  -->
  <!-- ================================================================= -->
  <section
    v-if="variant === 'classic'"
    class="hero-section"
    aria-label="Temple Hero Section"
  >
    <!-- Background Ambient Layers (Solid background, no gradients) -->
    <div class="hero-bg-layer" aria-hidden="true"></div>

    <!-- Main Side-by-Side / Vertical Responsive Container -->
    <div class="hero-split-container">
      <!-- 1. LEFT: HERO TEXT CONTENT & ACTIONS -->
      <div class="hero-content">
        <!-- SCHEDULE MESSAGE -->
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

        <!-- MAIN HEADING -->
        <h1 class="hero-title">
          {{ heroData.titleLine1 }}
          <span class="title-highlight">{{ heroData.titleHighlight }}</span>
        </h1>

        <!-- SUBTITLE -->
        <p class="hero-paragraph">
          {{ heroData.subtitle }}
        </p>

        <!-- ACTION BUTTONS -->
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

      <!-- 2. RIGHT: HERO IMAGE SLIDER -->
      <div
        class="hero-slider-col"
        @mouseenter="pauseSlider"
        @mouseleave="resumeSlider"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        aria-roledescription="carousel"
        aria-label="Sacred Temple Darshan Slider"
      >
        <div class="hero-slider-card">
          <!-- Top Badges Overlay -->
          <div class="slider-top-bar">
            <div class="slider-beacon-pill">
              <span class="beacon-dot"></span>
              <span class="beacon-label">LIVE DARSHAN ACTIVE</span>
            </div>
            <span class="slider-category-badge">{{ currentSlide.badge }}</span>
          </div>

          <!-- Slide Image Viewport with Smooth Transition -->
          <div class="slider-image-viewport">
            <transition name="hero-slide-fade" mode="out-in">
              <img
                :key="currentSlideIndex"
                :src="currentSlide.image"
                :alt="currentSlide.title"
                class="slider-img"
                loading="eager"
              />
            </transition>
            <div class="slider-glow-layer" aria-hidden="true"></div>
          </div>

          <!-- Bottom Caption & Controls Bar -->
          <div class="slider-bottom-bar">
            <div class="slider-caption-text">
              <h3 class="slider-deity-title">{{ currentSlide.title }}</h3>
              <p class="slider-deity-subtitle">{{ currentSlide.subtitle }}</p>
            </div>

            <!-- Controls: Prev, Counter, Next -->
            <div class="slider-controls-wrap">
              <button
                type="button"
                class="slider-nav-btn prev"
                aria-label="Previous slide"
                @click="prevSlide"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>

              <span class="slider-counter" aria-live="polite">
                {{ String(currentSlideIndex + 1).padStart(2, '0') }} / {{ String(heroSlides.length).padStart(2, '0') }}
              </span>

              <button
                type="button"
                class="slider-nav-btn next"
                aria-label="Next slide"
                @click="nextSlide"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Pagination Indicator Dots -->
          <div class="slider-dots" role="tablist" aria-label="Slider Pagination">
            <button
              v-for="(_, idx) in heroSlides"
              :key="idx"
              type="button"
              class="slider-dot"
              :class="{ 'is-active': idx === currentSlideIndex }"
              :aria-label="`Go to slide ${idx + 1}`"
              :aria-selected="idx === currentSlideIndex"
              @click="goToSlide(idx)"
            ></button>
          </div>
        </div>
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
              src="/images/deities/shiva.jpg"
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
  min-height: 100vh;
  min-height: 100dvh;
  margin-top: calc(-1 * var(--nav-height, 72px));
  padding-top: calc(var(--nav-height, 72px) + 2rem);
  padding-bottom: 3.5rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: var(--bg-primary);
  box-sizing: border-box;
}

@media (max-width: 1024px) {
  .hero-section {
    height: auto;
    min-height: 100dvh;
    padding-top: calc(var(--nav-height, 64px) + 2rem);
    padding-bottom: 4.5rem;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }
}

@media (max-width: 640px) {
  .hero-section {
    padding-top: calc(var(--nav-height, 64px) + 1.5rem);
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

/* Split side-by-side container on desktop, vertical responsive */
.hero-split-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: center;
  gap: 3.5rem;
}

@media (max-width: 1024px) {
  .hero-split-container {
    grid-template-columns: 1fr;
    gap: 2.5rem;
    max-width: 620px;
  }
}

.hero-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 640px;
  margin: 0;
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

@media (max-width: 1024px) {
  .hero-content {
    max-width: 100%;
    margin: 0 auto;
    text-align: center;
    align-items: center;
  }
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
  background: var(--accent-green, #4ADE80);
}

.pulse-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: var(--accent-green, #4ADE80);
  opacity: 0.45;
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
  font-size: clamp(2rem, 3.2vw, 3.4rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.035em;
  color: var(--text-primary);
  max-width: 620px;
  margin-bottom: 1rem;
  text-align: left;
}

.title-highlight {
  display: block;
  color: var(--accent-text);
}

.hero-paragraph {
  font-size: clamp(0.95rem, 1.3vw, 1.1rem);
  color: var(--text-secondary);
  max-width: 540px;
  line-height: 1.65;
  margin-bottom: 1.85rem;
  text-align: left;
}

@media (max-width: 1024px) {
  .hero-title,
  .hero-paragraph {
    text-align: center;
    max-width: 100%;
  }
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 1024px) {
  .hero-actions {
    justify-content: center;
  }
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

/* ----------------------------------------------------
   HERO SLIDER STYLES
---------------------------------------------------- */
.hero-slider-col {
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 10;
}

.hero-slider-card {
  position: relative;
  width: 100%;
  max-width: 480px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.hero-slider-card:hover {
  border-color: var(--accent);
  box-shadow: 0 20px 48px var(--accent-glow);
}

.slider-top-bar {
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.slider-beacon-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.75rem;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
}

.beacon-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-green, #4ADE80);
  box-shadow: 0 0 8px var(--accent-green, #4ADE80);
}

.beacon-label {
  font-size: 0.685rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #FFFFFF;
  text-transform: uppercase;
}

.slider-category-badge {
  font-size: 0.685rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.35rem 0.75rem;
  background: rgba(224, 165, 38, 0.9);
  color: #3F0A12;
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.slider-image-viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3.4;
  overflow: hidden;
  background-color: #1A0D00;
}

.slider-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}

.slider-glow-layer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.3) 0%,
    transparent 35%,
    transparent 60%,
    rgba(0, 0, 0, 0.65) 100%
  );
  pointer-events: none;
}

.slider-bottom-bar {
  padding: 1rem 1.25rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--bg-card);
  border-top: 1px solid var(--border-subtle);
}

.slider-caption-text {
  flex: 1;
  min-width: 0;
}

.slider-deity-title {
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-brand);
  margin: 0 0 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.dark) .slider-deity-title {
  color: var(--accent);
}

.slider-deity-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slider-controls-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.slider-nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}

.slider-nav-btn:hover {
  background: var(--accent);
  color: #3F0A12;
  border-color: var(--accent);
  transform: scale(1.05);
}

.slider-nav-btn svg {
  width: 16px;
  height: 16px;
}

.slider-counter {
  font-family: monospace;
  font-size: 0.785rem;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 48px;
  text-align: center;
}

.slider-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0 1.25rem 0.85rem;
  background: var(--bg-card);
}

.slider-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: var(--border-color);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
}

.slider-dot.is-active {
  width: 24px;
  background: var(--color-brand);
}

:global(.dark) .slider-dot.is-active {
  background: var(--accent);
}

/* Crossfade animation */
.hero-slide-fade-enter-active,
.hero-slide-fade-leave-active {
  transition: opacity 0.4s ease;
}

.hero-slide-fade-enter-from,
.hero-slide-fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .hero-slider-card {
    border-radius: 16px;
  }

  .slider-image-viewport {
    aspect-ratio: 4 / 3.2;
  }

  .slider-top-bar {
    top: 0.75rem;
    left: 0.75rem;
    right: 0.75rem;
  }

  .beacon-label,
  .slider-category-badge {
    font-size: 0.625rem;
    padding: 0.25rem 0.6rem;
  }

  .slider-deity-title {
    font-size: 1.05rem;
  }

  .slider-bottom-bar {
    padding: 0.85rem 1rem 0.65rem;
  }
}

@media (max-width: 1024px), (max-height: 760px) {
  .hero-scroller {
    display: none;
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
  background-color: var(--accent-green, #4ADE80);
  box-shadow: 0 0 8px var(--accent-green, #4ADE80);
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
