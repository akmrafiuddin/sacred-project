<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useAboutData } from "~/composables/useAboutData";
import AboutHero from "~/components/AboutHero.vue";
import ImageSlider, { type SliderImage } from "~/components/ImageSlider.vue";
import AboutArticle from "~/components/AboutArticle.vue";

const route = useRoute();
const { about, hero, history, pillars, shrines, administration, guidelines } = useAboutData();

// Locale state ('en' | 'bn')
const currentLocale = ref<"en" | "bn">("en");

// Theme state (check route query for SSR, localStorage for client)
const isDarkMode = computed(() => {
  return route.query.theme === "dark";
});

onMounted(() => {
  if (route.query.lang === "bn") {
    currentLocale.value = "bn";
  } else if (route.query.lang === "en") {
    currentLocale.value = "en";
  } else if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("temple_lang");
    if (saved === "BN" || saved === "bn") {
      currentLocale.value = "bn";
    }
  }

  if (typeof document !== "undefined") {
    if (route.query.theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else if (route.query.theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }
});

watch(currentLocale, (newLoc) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("temple_lang", newLoc.toUpperCase());
  }
});

// Dynamic Hero Title & Subtitle based on Locale
const heroTitle = computed(() => {
  if (currentLocale.value === "bn") {
    return hero.value.titleBn || "শ্রীশ্রী গোলপাহাড় মহাশ্মশান কালী মন্দির";
  }
  return hero.value.titleEn || "Sanctuary of Devotion, Peace & Community";
});

const heroSubtitle = computed(() => {
  if (currentLocale.value === "bn") {
    return "চট্টগ্রামের ঐতিহাসিক মেহেদীবাগে অবস্থিত শতাব্দীপ্রাচীন মহাশ্মশান ও শ্রীশ্রী দক্ষিণাকালী মন্দির।";
  }
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

// Article Editorial HTML for English & Bengali
const articleHtml = computed(() => {
  if (currentLocale.value === "bn") {
    return `
      <p>চট্টগ্রামের মেহেদীবাগের পবিত্র গোলপাহাড় মহাশ্মশান কালী মন্দির শতাব্দীর পর শতাব্দী ধরে ভক্তি, শান্তি ও মানবকল্যাণের এক পুণ্যভূমি। এখানে বৈদিক মর্যাদায় নিত্য পূজা, অন্নদান ও মহাশ্মশানের অন্ত্যেষ্টিক্রিয়া সম্পন্ন হয়।</p>
      <p>মা কালীর মহাশ্মশান রূপ কেবল প্রলয়ের প্রতীক নয়, বরং তা মোহমুক্তি ও পরম কল্যাণের পবিত্র আসন। দেশ-বিদেশের অগণিত ভক্ত এখানে মানসিক শান্তি ও রোগমুক্তি কামনায় সমবেত হন।</p>

      <blockquote>
        “যেখানে জাগতিক অহংকার বিলীন হয়, সেখানেই জাগ্রত হয় পরম চৈতন্য। মহাশ্মশানে মা কালী সংহারিণী নন, তিনি ভবতারিণী ও মোক্ষদায়িনী পরম জননী।”
        <cite>সনাতন সাধক পরম্পরা</cite>
      </blockquote>

      <p>দশকের পর দশক ধরে ভক্তবৃন্দের আন্তরিক নিষ্ঠা এবং গোলপাহাড় মহাশ্মশান পরিচালনা পরিষদের সুশৃঙ্খল তত্ত্বাবধানে এটি আজ একটি শান্ত ও পবিত্র তীর্থ কমপ্লেক্সে রূপ লাভ করেছে।</p>

      <h2>ঐতিহাসিক প্রেক্ষাপট ও ধারাবাহিকতা</h2>
      <p>চট্টগ্রামের প্রাচীন ঐতিহ্য ধারণ করে এই মহাপুণ্যস্থান যুগে যুগে ভক্তদের আশ্রয় হয়ে উঠেছে:</p>
      <ul>
        ${history.value.milestones
          .map(
            (m) =>
              `<li><strong>${m.period} — ${m.title}:</strong> ${m.description}</li>`
          )
          .join("")}
      </ul>

      <h2>আমাদের মূল নীতি ও সেবামূলক দর্শন</h2>
      <p>প্রতিটি প্রাত্যহিক আরতি, অন্নদান সেবা এবং ধর্মীয় অনুষ্ঠানে এই চার নীতি অনুসৃত হয়:</p>
      <ul>
        ${pillars.value
          .map(
            (p) =>
              `<li><strong>${p.titleBn || p.title}:</strong> ${p.description} (<em>${p.emphasis}</em>)</li>`
          )
          .join("")}
      </ul>

      <h2>পবিত্র মন্দির চত্বর ও দর্শনীয় স্থানসমূহ</h2>
      <p>প্রার্থনা ও আধ্যাত্মিক প্রশান্তির জন্য নির্ধারিত পবিত্র স্থানসমূহ:</p>
      <ul>
        ${shrines.value
          .map(
            (s) =>
              `<li><strong>${s.nameBn || s.name}:</strong> ${s.description} <em>(মাহাত্ম্য: ${s.significance})</em></li>`
          )
          .join("")}
      </ul>

      <h2>${administration.value.titleBn || "মন্দির পরিচালনা পরিষদ ও ট্রাস্ট"}</h2>
      <p>${administration.value.description}</p>
      <p><strong>${administration.value.committeeName}</strong></p>
      <ul>
        ${administration.value.keyResponsibilities
          .map((r) => `<li>${r}</li>`)
          .join("")}
      </ul>
      <p><em>${administration.value.registrationInfo}</em></p>

      <h2>মন্দিরে আগত দর্শনার্থীদের শিষ্টাচার ও নিয়মাবলী</h2>
      <p>মন্দির চত্বরের পবিত্রতা ও ভাবগাম্ভীর্য রক্ষায় সকল দর্শনার্থী ও পুণ্যার্থীদের নিম্নোক্ত নিয়মাবলী পালনের অনুরোধ করা হচ্ছে:</p>
      <ol>
        ${guidelines.value
          .map((g) => `<li><strong>${g.title}:</strong> ${g.rule}</li>`)
          .join("")}
      </ol>
    `;
  }

  // English HTML
  const paras = history.value.narrativeParagraphs || [];
  const para1 = paras[0] || "";
  const para2 = paras[1] || "";
  const para3 = paras[2] || "";

  return `
    <p>${para1}</p>
    <p>${para2}</p>

    <blockquote>
      “${history.value.quote}”
      <cite>${history.value.quoteAuthor}</cite>
    </blockquote>

    <p>${para3}</p>

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

    <h2>Four Sacred Pillars of Golpahar</h2>
    <p>Guiding every morning aarti, community prasad distribution, and spiritual ritual at the holy hill of Chittagong:</p>
    <ul>
      ${pillars.value
        .map(
          (p) =>
            `<li><strong>${p.title}:</strong> ${p.description} (<em>${p.emphasis}</em>)</li>`
        )
        .join("")}
    </ul>

    <h2>Sanctified Shrines & Mandir Pavilions</h2>
    <p>A harmonious spiritual compound designed for deep meditation, heartfelt prayer, and communal fellowship:</p>
    <ul>
      ${shrines.value
        .map(
          (s) =>
            `<li><strong>${s.name}:</strong> ${s.description} <em>Significance: ${s.significance}</em></li>`
        )
        .join("")}
    </ul>

    <h2>Temple Governance & Administration</h2>
    <p>${administration.value.description}</p>
    <p><strong>${administration.value.committeeName}</strong> oversees core temple responsibilities:</p>
    <ul>
      ${administration.value.keyResponsibilities
        .map((r) => `<li>${r}</li>`)
        .join("")}
    </ul>
    <p><em>${administration.value.registrationInfo}</em></p>

    <h2>Guidelines for Visiting Pilgrims</h2>
    <p>To preserve the divine serenity and scriptural sanctity of the temple premises, we kindly request all visitors to observe these guidelines:</p>
    <ol>
      ${guidelines.value
        .map((g) => `<li><strong>${g.title}:</strong> ${g.rule}</li>`)
        .join("")}
    </ol>
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
        "Sacred heritage, historical origins, core spiritual pillars, and temple administration of Golpahar Mohashoshan Kali Mandir in Chittagong.",
    },
  ],
});
</script>

<template>
  <div
    class="about-page"
    :class="{ 'is-dark': isDarkMode }"
    :data-theme="isDarkMode ? 'dark' : undefined"
    :lang="currentLocale"
  >
    <!-- 1. TITLE BAND (Hero) -->
    <AboutHero
      :title="heroTitle"
      :subtitle="heroSubtitle"
      :lang="currentLocale"
      :is-dark="isDarkMode"
    />

    <!-- Quiet editorial language switch pill bar -->
    <div class="about-locale-switch-bar">
      <div class="locale-pills" role="radiogroup" aria-label="Article Language">
        <button
          type="button"
          class="locale-pill"
          :class="{ active: currentLocale === 'en' }"
          :aria-checked="currentLocale === 'en'"
          role="radio"
          @click="currentLocale = 'en'"
        >
          English
        </button>
        <span class="locale-divider" aria-hidden="true">/</span>
        <button
          type="button"
          class="locale-pill"
          :class="{ active: currentLocale === 'bn' }"
          :aria-checked="currentLocale === 'bn'"
          role="radio"
          @click="currentLocale = 'bn'"
        >
          বাংলা
        </button>
      </div>
    </div>

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
        :locale="currentLocale"
        :is-dark="isDarkMode"
      />
    </div>
  </div>
</template>

<style scoped>
/* ----------------------------------------------------
   ABOUT PAGE FLOW & SPACING SYSTEM (Section 1 & 3)
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

/* Dark Mode Overrides (Section 10) */
.about-page.is-dark,
:global(html[data-theme="dark"]) .about-page,
:global(html.dark) .about-page {
  background-color: var(--midnight, #14101F) !important;
  color: var(--ivory, #F3EBDD) !important;
}

/* Subtle Editorial Language Switch Bar */
.about-locale-switch-bar {
  max-width: 46rem; /* Aligned with reading column */
  margin-inline: auto;
  padding: 1.25rem 1.25rem 0;
  display: flex;
  justify-content: flex-end;
}

@media (min-width: 768px) {
  .about-locale-switch-bar {
    padding: 1.5rem 0 0;
  }
}

.locale-pills {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: color-mix(in srgb, var(--bg-card, #FFFFFF) 85%, transparent);
  border: 1px solid var(--border-color, rgba(224, 165, 38, 0.45));
  border-radius: 9999px;
  padding: 0.25rem 0.65rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.about-page.is-dark .locale-pills,
:global(html[data-theme="dark"]) .locale-pills,
:global(html.dark) .locale-pills {
  background: color-mix(in srgb, var(--bg-card, #241B36) 85%, transparent);
  border-color: var(--border-color, #3A2D52);
}

.locale-pill {
  background: transparent;
  border: none;
  font-family: var(--font-sans, system-ui, sans-serif);
  font-size: 0.775rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--text-muted, rgba(43, 26, 23, 0.65));
  cursor: pointer;
  padding: 0.2rem 0.45rem;
  border-radius: 9999px;
  transition: all 0.15s ease;
}

.locale-pill:hover {
  color: var(--accent, #E0A526);
}

.about-page.is-dark .locale-pill:hover,
:global(html[data-theme="dark"]) .locale-pill:hover,
:global(html.dark) .locale-pill:hover {
  color: var(--accent-text, #E6B34A);
}

.locale-pill.active {
  color: var(--text-primary, #2B1A17);
  background-color: color-mix(in srgb, var(--accent, #E0A526) 18%, transparent);
  font-weight: 700;
}

.about-page.is-dark .locale-pill.active,
:global(html[data-theme="dark"]) .locale-pill.active,
:global(html.dark) .locale-pill.active {
  color: var(--ivory, #F3EBDD);
  background-color: color-mix(in srgb, var(--accent, #D7263D) 28%, transparent);
}

.locale-divider {
  color: var(--border-color, rgba(224, 165, 38, 0.45));
  font-size: 0.75rem;
}

.about-page.is-dark .locale-divider,
:global(html[data-theme="dark"]) .locale-divider,
:global(html.dark) .locale-divider {
  color: var(--border-color, #3A2D52);
}

/* Vertical Rhythm per Section 3 */
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
  margin-top: 1rem;
  margin-bottom: 4rem; /* 64px mobile */
}

/* When slider is absent, gap from title band / switcher to article */
.about-article-slot.no-slider {
  margin-top: 1.5rem; /* ~32px total from hero mobile */
}

@media (min-width: 768px) {
  .about-article-slot {
    margin-top: 1.5rem;
    margin-bottom: 6rem; /* 96px desktop */
  }

  .about-article-slot.no-slider {
    margin-top: 2rem; /* ~56px total from hero desktop */
  }
}
</style>
