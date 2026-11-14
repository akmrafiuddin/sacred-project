<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  lang?: "en" | "bn";
  isDark?: boolean;
}>();
</script>

<template>
  <header
    class="about-hero-band"
    :class="{ 'is-dark': isDark }"
    :lang="lang || 'en'"
    role="banner"
  >
    <div class="hero-container">
      <h1 class="hero-title" :class="{ 'is-bn': lang === 'bn' }">
        {{ title }}
      </h1>
      <p v-if="subtitle && subtitle.trim()" class="hero-subtitle">
        {{ subtitle }}
      </p>
    </div>
  </header>
</template>

<style scoped>
/* ----------------------------------------------------
   ABOUT TITLE BAND (Section 4)
   Full-width deep maroon band, left-aligned on desktop,
   warm contrast, thin amber accent line at bottom edge.
---------------------------------------------------- */
.about-hero-band {
  width: 100%;
  background-color: var(--brand-deep, #3F0A12);
  background-image: linear-gradient(
    180deg,
    var(--brand-deep, #3F0A12) 0%,
    var(--nav-bg-scrolled, #6E0516) 100%
  );
  border-bottom: 2px solid var(--accent, #E0A526);
  padding: 2.5rem 0; /* 40px mobile */
  position: relative;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

@media (min-width: 768px) {
  .about-hero-band {
    padding: 4.5rem 0; /* 72px desktop */
  }
}

.hero-container {
  max-width: 64rem; /* 1024px matching slider width */
  margin-inline: auto;
  padding-inline: 1.25rem; /* px-5 mobile */
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

@media (min-width: 768px) {
  .hero-container {
    padding-inline: 2rem; /* px-8 tablet & up */
  }
}

.hero-title {
  margin: 0;
  font-family: var(--font-serif, "Cinzel", "Playfair Display", Georgia, serif);
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: 0.015em;
  color: var(--nav-text, #F7EFE0); /* Near-white / cream meets WCAG AAA against deep maroon */
  word-break: normal;
  overflow-wrap: break-word;
  max-width: 100%;
}

.hero-subtitle {
  margin: 0.75rem 0 0 0; /* 12px margin-top */
  font-family: var(--font-sans, "Plus Jakarta Sans", system-ui, sans-serif);
  font-size: clamp(1rem, 2vw, 1.25rem);
  line-height: 1.6;
  color: rgba(247, 239, 224, 0.82);
  max-width: 40rem;
}

/* Dark mode token overrides */
.about-hero-band.is-dark,
:global(html[data-theme="dark"]) .about-hero-band,
:global(html.dark) .about-hero-band {
  background-color: var(--brand-deep, #0D0A15);
  background-image: linear-gradient(
    180deg,
    var(--brand-deep, #0D0A15) 0%,
    var(--nav-bg, #241B36) 100%
  );
  border-bottom-color: var(--accent, #D7263D);
}
</style>
