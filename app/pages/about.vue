<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAboutData } from "~/composables/useAboutData";
import AboutHero from "~/components/AboutHero.vue";
import ImageSlider, { type SliderImage } from "~/components/ImageSlider.vue";
import AboutArticle from "~/components/AboutArticle.vue";

const route = useRoute();
const { about, hero, history, administration } = useAboutData();

// Theme state (check route query for SSR, standard theme system for client)
const isDarkMode = computed(() => {
  return route.query.theme === "dark";
});

// Dynamic Hero Title & Subtitle in English
const heroTitle = computed(() => {
  return hero.value.title || "Sanctuary of Devotion, Peace & Community";
});

const heroSubtitle = computed(() => {
  return hero.value.subtitle || "";
});

// Optional Slider Images (Gracefully empty if not present in current data model)
const sliderImages = computed<SliderImage[]>(() => {
  const customImages = (about.value as any)?.images;
  if (Array.isArray(customImages) && customImages.length > 0) {
    return customImages;
  }
  return [];
});

const hasSlider = computed(() => sliderImages.value.length > 0);

// Article Editorial HTML in English
const articleHtml = computed(() => {
  const paras = history.value.narrativeParagraphs || [];
  const para1 = paras[0] || "";
  const para2 = paras[1] || "";
  const para3 = paras[2] || "";
  const otherParas = paras.slice(3).map((p) => `<p>${p}</p>`).join("");

  return `
    <p>${para1}</p>
    <p>${para2}</p>

    <blockquote>
      “${history.value.quote}”
      <cite>${history.value.quoteAuthor}</cite>
    </blockquote>

    <p>${para3}</p>
    ${otherParas}

    <h2>Sacred Origins & Historical Milestones</h2>
    <p>Throughout its history, the hilltop has stood as a guardian of sacred Sanatan traditions in Chittagong:</p>
    <ul>
      ${history.value.milestones
        .map(
          (m) =>
            `<li><strong>${m.period} — ${m.title}:</strong> ${m.description}</li>`
        )
        .join("")}
    </ul>

    <h2>${administration.value.title || "Temple Governance & Administration"}</h2>
    <p>${administration.value.description}</p>
    <p><strong>${administration.value.committeeName}</strong> oversees core temple responsibilities:</p>
    <ul>
      ${administration.value.keyResponsibilities
        .map((r) => `<li>${r}</li>`)
        .join("")}
    </ul>
    <p><em>${administration.value.registrationInfo}</em></p>
  `;
});

useHead({
  title: "About Us - Sacred Heritage & Spiritual Legacy",
  meta: [
    {
      name: "description",
      content:
        "Learn about Golpahar Mohashoshan Kali Mandir in Chittagong, Bangladesh. Centuries of spiritual devotion, daily Annadanam, historic Mahashoshan heritage, and selfless humanitarian seva.",
    },
    { property: "og:title", content: "About Golpahar Mohashoshan Kali Mandir" },
    {
      property: "og:description",
      content:
        "Sacred heritage, historical origins, and temple administration of Golpahar Mohashoshan Kali Mandir in Chittagong.",
    },
  ],
});
</script>

<template>
  <div
    class="about-page"
    :class="{ 'is-dark': isDarkMode }"
    :data-theme="isDarkMode ? 'dark' : undefined"
    lang="en"
  >
    <!-- 1. TITLE BAND (Hero) -->
    <AboutHero
      :title="heroTitle"
      :subtitle="heroSubtitle"
      lang="en"
      :is-dark="isDarkMode"
    />

    <!-- 2. SLIDER GALLERY / FEATURE IMAGE (Optional, renders nothing if 0 images) -->
    <div v-if="hasSlider" class="about-slider-slot">
      <ImageSlider :images="sliderImages" />
    </div>

    <!-- 3. MAIN ARTICLE (Reading Column) -->
    <div
      class="about-article-slot"
      :class="{ 'no-slider': !hasSlider }"
    >
      <AboutArticle
        :html="articleHtml"
        locale="en"
        :is-dark="isDarkMode"
      />
    </div>
  </div>
</template>

<style scoped>
/* ----------------------------------------------------
   ABOUT PAGE FLOW & SPACING SYSTEM
   Title Band -> (Optional Slider) -> Main Article
   Warm cream background, editorial layout, strict rhythm.
---------------------------------------------------- */
.about-page {
  width: 100%;
  min-height: 80vh;
  background-color: var(--bg-primary, #F7EFE0);
  color: var(--text-primary, #2B1A17);
  transition: background-color 0.25s ease, color 0.25s ease;
  position: relative;
}

/* Dark Mode Overrides */
.about-page.is-dark,
:global(html[data-theme="dark"]) .about-page,
:global(html.dark) .about-page {
  background-color: var(--midnight, #14101F) !important;
  color: var(--ivory, #F3EBDD) !important;
}

/* Vertical Rhythm */
.about-slider-slot {
  margin-top: 2rem; /* 32px mobile */
  margin-bottom: 2rem; /* 32px mobile */
}

@media (min-width: 768px) {
  .about-slider-slot {
    margin-top: 3.5rem; /* 56px desktop */
    margin-bottom: 3rem; /* 48px desktop */
  }
}

.about-article-slot {
  margin-top: 1.5rem;
  margin-bottom: 4rem; /* 64px mobile */
}

/* When slider is absent, gap from title band to article */
.about-article-slot.no-slider {
  margin-top: 2rem; /* ~32px mobile */
}

@media (min-width: 768px) {
  .about-article-slot {
    margin-top: 2rem;
    margin-bottom: 6rem; /* 96px desktop */
  }

  .about-article-slot.no-slider {
    margin-top: 3rem; /* ~48px desktop */
  }
}
</style>
