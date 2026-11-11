<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useTempleDataFast } from "~/composables/useTempleDataFast";

const props = withDefaults(
  defineProps<{
    variant?: "classic" | "kesari";
  }>(),
  {
    variant: "classic",
  }
);

const { deities } = useTempleDataFast();

const currentDeityIndex = ref(0);
let deityAutoPlayTimer: ReturnType<typeof setInterval> | null = null;

const nextDeity = () => {
  const len = deities.value.length || 1;
  currentDeityIndex.value = (currentDeityIndex.value + 1) % len;
};

const prevDeity = () => {
  const len = deities.value.length || 1;
  currentDeityIndex.value = (currentDeityIndex.value - 1 + len) % len;
};

const goToDeity = (idx: number) => {
  currentDeityIndex.value = idx;
};

const startDeityAutoPlay = () => {
  if (typeof window !== "undefined" && !deityAutoPlayTimer) {
    deityAutoPlayTimer = setInterval(() => {
      nextDeity();
    }, 5500);
  }
};

const pauseDeityAutoPlay = () => {
  if (deityAutoPlayTimer) {
    clearInterval(deityAutoPlayTimer);
    deityAutoPlayTimer = null;
  }
};

onMounted(() => {
  startDeityAutoPlay();
});

onUnmounted(() => {
  pauseDeityAutoPlay();
});
</script>

<template>
  <!-- ================================================================= -->
  <!-- VARIANT 1: CLASSIC (Interactive Split-View Deities Carousel)       -->
  <!-- ================================================================= -->
  <section
    v-if="variant === 'classic'"
    id="deities-section"
    class="deities-section"
    aria-label="The Sacred Deities"
  >
    <div class="deities-layout">
      <!-- LEFT COLUMN: Title Only -->
      <div class="deities-left">
        <h2 class="deities-title">
          The Sacred<br />
          <span class="title-highlight">Deities</span>
        </h2>
      </div>

      <!-- RIGHT COLUMN: Image Slider -->
      <div class="deities-right">
        <div
          class="slider-wrapper"
          @mouseenter="pauseDeityAutoPlay"
          @mouseleave="startDeityAutoPlay"
        >
          <!-- Slider Frame -->
          <div class="slider-frame">
            <transition-group name="slide-fade" tag="div" class="slides-container">
              <div
                v-for="(deity, idx) in deities"
                v-show="idx === currentDeityIndex"
                :key="deity.id"
                class="slide-item"
              >
                <img
                  :src="deity.image"
                  :alt="deity.name"
                  class="slide-image" width="800" height="600" decoding="async"
                  loading="lazy"
                />
                <!-- Subtle Gradient Mask for Text Readability -->
                <div class="slide-overlay">
                  <span class="slide-subtitle">{{ deity.title }}</span>
                  <h3 class="slide-name">{{ deity.name }}</h3>
                  <p class="slide-desc">{{ deity.description }}</p>
                </div>
              </div>
            </transition-group>

            <!-- Navigation Buttons (Inside/Over Slider Frame) -->
            <button
              type="button"
              class="slider-nav-btn btn-prev"
              @click="prevDeity"
              aria-label="Previous deity"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button
              type="button"
              class="slider-nav-btn btn-next"
              @click="nextDeity"
              aria-label="Next deity"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <!-- Slider Footer (Bottom Row) -->
          <div class="slider-footer">
            <!-- Indicator Dots -->
            <div class="slider-dots" role="tablist">
              <button
                v-for="(deityItem, idx) in deities"
                :key="'dot-' + idx"
                type="button"
                class="dot-indicator"
                :class="{ 'dot-active': idx === currentDeityIndex }"
                @click="goToDeity(idx)"
                :aria-label="`View ${deityItem.name}`"
              ></button>
            </div>

            <!-- Counter -->
            <div class="slider-counter">
              <span class="counter-num active-num">
                {{ String(currentDeityIndex + 1).padStart(2, "0") }}
              </span>
              <span class="counter-slash">/</span>
              <span class="counter-num total-num">
                {{ String(deities.length).padStart(2, "0") }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ================================================================= -->
  <!-- VARIANT 2: KESARI (Interactive Tabbed Stage Showcase)             -->
  <!-- ================================================================= -->
  <section
    v-else
    id="alt-deities"
    class="alt-section"
    aria-label="The Sacred Deities"
  >
    <div class="alt-container">
      <div class="section-heading-split">
        <div>
          <span class="kesari-badge">Sacred Presence</span>
          <h2 class="section-title">The Sacred Deities</h2>
        </div>

        <!-- Deity Quick Tab Selector -->
        <div class="deity-tabs" role="tablist">
          <button
            v-for="(deity, idx) in deities"
            :key="'tab-' + deity.id"
            type="button"
            class="deity-tab-btn"
            :class="{ 'tab-active': idx === currentDeityIndex }"
            @click="goToDeity(idx)"
            :aria-selected="idx === currentDeityIndex"
          >
            {{ deity.name }}
          </button>
        </div>
      </div>

      <!-- Deity Stage Showcase Card -->
      <div
        class="deity-stage-card"
        @mouseenter="pauseDeityAutoPlay"
        @mouseleave="startDeityAutoPlay"
      >
        <div class="stage-img-side">
          <img
            :src="deities[currentDeityIndex]?.image"
            :alt="deities[currentDeityIndex]?.name"
            class="stage-img"
          />
        </div>

        <div class="stage-info-side">
          <span class="stage-tag">{{ deities[currentDeityIndex]?.title }}</span>
          <h3 class="stage-name">{{ deities[currentDeityIndex]?.name }}</h3>
          <p class="stage-desc">{{ deities[currentDeityIndex]?.description }}</p>

          <div class="stage-controls">
            <button
              type="button"
              class="stage-nav-btn"
              @click="prevDeity"
              aria-label="Previous deity"
            >
              &larr;
            </button>
            <span class="stage-counter">
              {{ String(currentDeityIndex + 1).padStart(2, '0') }} / {{ String(deities.length).padStart(2, '0') }}
            </span>
            <button
              type="button"
              class="stage-nav-btn"
              @click="nextDeity"
              aria-label="Next deity"
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ----------------------------------------------------
   CLASSIC DEITIES STYLES (Layout 1)
---------------------------------------------------- */
.deities-section {
  width: 100%;
  padding: 6.5rem 1.5rem;
  background-color: var(--bg-primary);
  position: relative;
}

.deities-layout {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  align-items: center;
}

@media (min-width: 900px) {
  .deities-layout {
    grid-template-columns: 340px 1fr;
    gap: 4.5rem;
  }
}

.deities-title {
  font-size: clamp(2.25rem, 3.8vw, 3.4rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  margin: 0;
}

.title-highlight {
  display: block;
  color: var(--accent-text);
}

.slider-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.slider-frame {
  position: relative;
  width: 100%;
  height: 480px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background-color: var(--bg-card);
}

@media (max-width: 640px) {
  .slider-frame {
    height: 380px;
  }
}

.slides-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.slide-item {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.slide-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 25%;
  display: block;
}

.slide-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(63, 10, 18, 0.92) 0%, rgba(63, 10, 18, 0.55) 60%, transparent 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 2.25rem;
}

@media (max-width: 640px) {
  .slide-overlay {
    padding: 1.5rem 1.25rem;
  }
}

.slide-subtitle {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.35rem;
  display: block;
}

.slide-name {
  font-size: clamp(1.45rem, 2.5vw, 1.95rem);
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 0.4rem;
  letter-spacing: -0.015em;
}

.slide-desc {
  font-size: 0.925rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.55;
  max-width: 540px;
  margin: 0;
}

.slider-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(11, 17, 32, 0.65);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 10;
  padding: 0;
}

.slider-nav-btn svg {
  width: 20px;
  height: 20px;
}

.btn-prev {
  left: 1.25rem;
}

.btn-next {
  right: 1.25rem;
}

.slider-nav-btn:hover {
  background: var(--accent);
  color: var(--btn-cta-text, #3F0A12);
  border-color: var(--accent);
  transform: translateY(-50%) scale(1.06);
  box-shadow: 0 6px 20px var(--accent-glow);
}

.slider-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5rem;
}

.slider-dots {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.dot-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--border-color);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
}

.dot-active {
  background-color: var(--accent);
  transform: scale(1.3);
  box-shadow: 0 0 10px var(--accent);
}

.slider-counter {
  font-family: inherit;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: var(--text-muted);
}

.active-num {
  color: var(--accent-text);
  font-size: 1.05rem;
}

.counter-slash {
  margin: 0 0.25rem;
  opacity: 0.5;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: scale(1.04);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

/* ----------------------------------------------------
   KESARI DEITIES STYLES (Layout 2)
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

.section-title {
  font-size: clamp(1.85rem, 3.2vw, 2.75rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.025em;
  color: var(--text-primary);
  margin: 0;
}

.deity-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (max-width: 640px) {
  .deity-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 0.35rem;
    scrollbar-width: none;
  }

  .deity-tabs::-webkit-scrollbar {
    display: none;
  }

  .deity-tab-btn {
    white-space: nowrap;
    flex-shrink: 0;
  }
}

.deity-tab-btn {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.825rem;
  font-weight: 700;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.deity-tab-btn:hover {
  border-color: var(--kesari, #ea580c);
  color: var(--text-primary);
}

.tab-active {
  background: var(--kesari, #ea580c) !important;
  color: #ffffff !important;
  border-color: var(--kesari, #ea580c) !important;
  box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35);
}

.deity-stage-card {
  display: grid;
  grid-template-columns: 1fr;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  overflow: hidden;
}

@media (min-width: 900px) {
  .deity-stage-card {
    grid-template-columns: 1fr 1fr;
    min-height: 480px;
  }
}

.stage-img-side {
  position: relative;
  min-height: 320px;
  background: #000;
}

@media (max-width: 640px) {
  .stage-img-side {
    min-height: 250px;
  }
}

.stage-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 25%;
  display: block;
}

.stage-info-side {
  padding: 3rem 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

@media (max-width: 640px) {
  .stage-info-side {
    padding: 1.75rem 1.25rem;
  }
}

.stage-tag {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--kesari, #ea580c);
  letter-spacing: 0.08em;
  margin-bottom: 0.6rem;
}

.stage-name {
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: 900;
  color: var(--text-primary);
  margin-bottom: 1.25rem;
  letter-spacing: -0.025em;
}

.stage-desc {
  font-size: 1.05rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 2rem;
}

.stage-controls {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-top: auto;
}

.stage-nav-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--nav-hover-bg);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stage-nav-btn:hover {
  background: var(--kesari, #ea580c);
  color: #ffffff;
  border-color: var(--kesari, #ea580c);
  transform: translateY(-2px);
}

.stage-counter {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-muted);
}
</style>
