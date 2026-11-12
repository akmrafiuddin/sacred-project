<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

export interface SliderImage {
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

const props = withDefaults(
  defineProps<{
    images?: SliderImage[];
  }>(),
  {
    images: () => [],
  }
);

const currentIndex = ref(0);
const sliderContainerRef = ref<HTMLElement | null>(null);

const count = computed(() => props.images.length);

const currentImage = computed(() => {
  if (count.value === 0) return null;
  return props.images[currentIndex.value] || props.images[0] || null;
});

const firstImage = computed(() => props.images[0] || null);

const currentCaption = computed(() => {
  if (!currentImage.value) return "";
  return currentImage.value.caption || currentImage.value.alt || "";
});

const isSingle = computed(() => count.value === 1);
const isMultiple = computed(() => count.value > 1);

const goToSlide = (idx: number) => {
  if (idx >= 0 && idx < count.value) {
    currentIndex.value = idx;
  }
};

const nextSlide = () => {
  if (count.value <= 1) return;
  currentIndex.value = (currentIndex.value + 1) % count.value;
};

const prevSlide = () => {
  if (count.value <= 1) return;
  currentIndex.value = (currentIndex.value - 1 + count.value) % count.value;
};

// Keyboard navigation (ArrowLeft / ArrowRight)
const handleKeyDown = (e: KeyboardEvent) => {
  if (count.value <= 1) return;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    prevSlide();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    nextSlide();
  }
};

// Touch swipe gestures
let touchStartX = 0;
let touchEndX = 0;

const onTouchStart = (e: TouchEvent) => {
  if (e.changedTouches[0]) {
    touchStartX = e.changedTouches[0].screenX;
  }
};

const onTouchEnd = (e: TouchEvent) => {
  if (count.value <= 1) return;
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
</script>

<template>
  <!-- Section 5.1: If 0 images, render nothing. No gap or empty placeholder. -->
  <section
    v-if="count > 0"
    ref="sliderContainerRef"
    class="image-slider-section"
    role="region"
    aria-roledescription="carousel"
    aria-label="Temple photo gallery"
    tabindex="0"
    @keydown="handleKeyDown"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <div class="slider-card-frame">
      <!-- Image Viewport with Fixed Aspect Ratio (16:9 desktop, 4:3 mobile) -->
      <div class="slider-viewport">
        <!-- 1 IMAGE: Static Feature Card (No controls) -->
        <div v-if="isSingle && firstImage" class="single-slide-view">
          <img
            :src="firstImage.src"
            :alt="firstImage.alt || 'Temple view'"
            :width="firstImage.width || 1280"
            :height="firstImage.height || 720"
            class="slide-img"
            loading="eager"
            fetchpriority="high"
          />
        </div>

        <!-- 2+ IMAGES: Interactive Slider -->
        <template v-else-if="isMultiple">
          <div
            v-for="(img, idx) in images"
            v-show="idx === currentIndex"
            :key="idx"
            class="slide-item"
            role="group"
            aria-roledescription="slide"
            :aria-label="`${idx + 1} of ${count}`"
          >
            <img
              :src="img.src"
              :alt="img.alt || `Temple photo ${idx + 1}`"
              :width="img.width || 1280"
              :height="img.height || 720"
              class="slide-img"
              :loading="idx === 0 ? 'eager' : 'lazy'"
              :fetchpriority="idx === 0 ? 'high' : 'auto'"
            />
          </div>

          <!-- Left/Right Nav Arrows (Inside Image) -->
          <button
            type="button"
            class="nav-arrow nav-prev"
            aria-label="Previous image"
            @click="prevSlide"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="arrow-svg"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <button
            type="button"
            class="nav-arrow nav-next"
            aria-label="Next image"
            @click="nextSlide"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="arrow-svg"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </template>
      </div>

      <!-- Footer Bar: Caption, Dots & Counter -->
      <div v-if="currentCaption || isMultiple" class="slider-footer-bar">
        <!-- Caption (centered) -->
        <p v-if="currentCaption" class="slider-caption">
          {{ currentCaption }}
        </p>

        <!-- Controls Row for Multiple Images -->
        <div v-if="isMultiple" class="slider-controls-row">
          <!-- Dots Indicator -->
          <div class="slider-dots" role="tablist" aria-label="Slides">
            <button
              v-for="(_, idx) in count"
              :key="idx"
              type="button"
              class="slider-dot"
              :class="{ 'is-active': idx === currentIndex }"
              :aria-label="`Go to image ${idx + 1}`"
              :aria-selected="idx === currentIndex"
              @click="goToSlide(idx)"
            ></button>
          </div>

          <!-- Counter (Bottom Right, e.g. 04 / 05) -->
          <div class="slider-counter" aria-live="polite">
            <span class="counter-curr">{{ String(currentIndex + 1).padStart(2, "0") }}</span>
            <span class="counter-sep">/</span>
            <span class="counter-total">{{ String(count).padStart(2, "0") }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ----------------------------------------------------
   SLIDER GALLERY & FEATURE IMAGE (Section 5)
   Fixed aspect ratio, zero layout shift, frame card.
---------------------------------------------------- */
.image-slider-section {
  width: 100%;
  max-width: 64rem; /* 1024px centered */
  margin-inline: auto;
  padding-inline: 1.25rem;
  outline: none;
}

@media (min-width: 768px) {
  .image-slider-section {
    padding-inline: 2rem;
  }
}

.image-slider-section:focus-visible {
  outline: 2px solid var(--accent, #E0A526);
  outline-offset: 4px;
}

.slider-card-frame {
  background-color: var(--bg-card, #FFFFFF);
  border: 1px solid var(--border-color, rgba(224, 165, 38, 0.45));
  border-radius: 18px;
  padding: 0.5rem; /* Inner white/card frame */
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.12);
  transition: background-color 0.25s ease, border-color 0.25s ease;
}

/* Aspect Ratio Box: 4:3 on mobile, 16:9 on desktop */
.slider-viewport {
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 12px;
  position: relative;
  background-color: var(--bg-secondary, #F2DFB4);
}

@media (min-width: 768px) {
  .slider-viewport {
    aspect-ratio: 16 / 9;
  }
}

.single-slide-view,
.slide-item {
  width: 100%;
  height: 100%;
  position: relative;
}

.slide-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

/* Nav Arrows (Centered vertically on left and right edges inside the frame) */
.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: var(--bg-card, #FFFFFF);
  background: color-mix(in srgb, var(--bg-card, #FFFFFF) 88%, transparent);
  border: 1px solid var(--border-color, rgba(224, 165, 38, 0.45));
  color: var(--text-primary, #2B1A17);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-arrow:hover {
  color: var(--accent, #E0A526);
  border-color: var(--accent, #E0A526);
  transform: translateY(-50%) scale(1.06);
}

.nav-arrow:active {
  transform: translateY(-50%) scale(0.96);
}

.nav-prev {
  left: 0.75rem;
}

.nav-next {
  right: 0.75rem;
}

.arrow-svg {
  width: 20px;
  height: 20px;
}

/* Footer Bar */
.slider-footer-bar {
  padding: 0.75rem 0.5rem 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slider-caption {
  margin: 0;
  text-align: center;
  font-family: var(--font-sans, "Plus Jakarta Sans", system-ui, sans-serif);
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--text-muted, rgba(43, 26, 23, 0.65));
}

.slider-controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline: 0.5rem;
  margin-top: 0.25rem;
}

/* Indicator Dots */
.slider-dots {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.slider-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border-radius: 50%;
  border: none;
  background-color: var(--border-color, rgba(224, 165, 38, 0.45));
  cursor: pointer;
  transition: all 0.2s ease;
}

.slider-dot.is-active {
  width: 22px;
  border-radius: 9999px;
  background-color: var(--accent, #E0A526);
}

/* Counter (04 / 05) */
.slider-counter {
  font-family: var(--font-sans, monospace);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--text-muted, rgba(43, 26, 23, 0.65));
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.counter-curr {
  color: var(--text-primary, #2B1A17);
  font-weight: 700;
}

.counter-sep {
  opacity: 0.5;
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .nav-arrow,
  .slider-dot {
    transition: none;
  }
}
</style>
