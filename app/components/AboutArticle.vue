<script setup lang="ts">
withDefaults(
  defineProps<{
    html?: string;
    locale?: "en" | "bn";
    isDark?: boolean;
  }>(),
  {
    html: "",
    locale: "en",
    isDark: false,
  }
);
</script>

<template>
  <main class="article-section">
    <article
      class="about-article"
      :class="{ 'is-dark': isDark }"
      :lang="locale"
      v-html="html"
    ></article>
  </main>
</template>

<style>
/* ----------------------------------------------------
   MAIN ARTICLE TYPOGRAPHY (Section 6 & Section 7)
   Unscoped or globally scoped to .about-article to style
   rendered HTML from existing content pipeline.
---------------------------------------------------- */
.article-section {
  width: 100%;
  padding-inline: 1.25rem; /* px-5 mobile */
  margin-inline: auto;
}

@media (min-width: 768px) {
  .article-section {
    padding-inline: 2rem; /* px-8 tablet & up */
  }
}

.about-article {
  max-width: 46rem; /* 736px reading column (65-75 chars/line) */
  margin-inline: auto;
  color: var(--text-primary, #2B1A17);
  font-family: var(--font-sans, "Plus Jakarta Sans", system-ui, sans-serif);
  font-size: 1rem;
  line-height: 1.8;
  transition: color 0.25s ease;
}

@media (min-width: 768px) {
  .about-article {
    font-size: 1.0625rem; /* 17px on desktop */
  }

  /* Article paragraph alignment */
  .about-article {
    text-align: justify;
    hyphens: auto;
  }
}

.about-article p {
  margin-block: 0 1.4em;
}

/* ----------------------------------------------------
   DROP CAP
   First paragraph only, display serif italic.
---------------------------------------------------- */
.about-article > p:first-of-type::first-letter {
  float: left;
  font-family: var(--font-serif, "Cinzel", "Playfair Display", Georgia, serif);
  font-style: italic;
  font-size: 4em;
  line-height: 0.78;
  padding: 0.02em 0.06em 0 0;
  margin-right: 0.06em;
  color: var(--accent, #E0A526);
  font-weight: 600;
}

/* Headings inside the article */
.about-article h2 {
  font-family: var(--font-serif, "Cinzel", "Playfair Display", Georgia, serif);
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 600;
  margin: 2em 0 0.5em;
  color: var(--heading-color, var(--text-primary, #6E0516));
  line-height: 1.25;
  letter-spacing: -0.01em;
  text-align: left;
}

.about-article h3 {
  font-family: var(--font-serif, "Cinzel", "Playfair Display", Georgia, serif);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.6em 0 0.4em;
  color: var(--heading-color, var(--text-primary, #6E0516));
  line-height: 1.35;
  text-align: left;
}

/* ----------------------------------------------------
   PULL QUOTES / BLOCKQUOTE (Section 6.4)
   Centred, breaks out slightly to 52rem, short amber rule,
   softened tone, uppercase attribution.
---------------------------------------------------- */
.about-article blockquote {
  max-width: 52rem;
  margin: 3.5rem auto;
  padding: 0 1rem;
  text-align: center;
  font-family: var(--font-serif, "Cinzel", "Playfair Display", Georgia, serif);
  font-style: italic;
  font-size: clamp(1.35rem, 3.5vw, 2rem);
  line-height: 1.45;
  color: var(--text-secondary, rgba(43, 26, 23, 0.78));
}

.about-article blockquote::before {
  content: "";
  display: block;
  width: 3rem;
  height: 2px;
  margin: 0 auto 1.5rem;
  background-color: var(--accent, #E0A526);
  border-radius: 2px;
}

.about-article blockquote cite,
.about-article blockquote footer {
  display: block;
  margin-top: 1rem;
  font-family: var(--font-sans, "Plus Jakarta Sans", system-ui, sans-serif);
  font-style: normal;
  font-size: 0.8125rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent, #E0A526);
  font-weight: 600;
  text-align: center;
}

/* ----------------------------------------------------
   LISTS, LINKS, EMPHASIS & DIVIDERS (Section 6.5)
---------------------------------------------------- */
.about-article ul,
.about-article ol {
  padding-left: 1.5rem;
  margin-block: 0 1.4em;
  text-align: left;
}

.about-article li {
  margin-block: 0.5em;
  line-height: 1.7;
}

.about-article li::marker {
  color: var(--accent, #E0A526);
  font-weight: 700;
}

.about-article a {
  color: var(--accent, #E0A526);
  text-decoration: none;
  text-underline-offset: 3px;
  transition: color 0.15s ease, text-decoration 0.15s ease;
}

.about-article a:hover,
.about-article a:focus-visible {
  text-decoration: underline;
}

.about-article strong {
  font-weight: 700;
  color: var(--text-primary, #2B1A17);
}

.about-article em {
  font-style: italic;
}

/* Ornamental divider (diamond & dots) */
.about-article hr {
  border: none;
  height: auto;
  margin: 3rem auto;
  text-align: center;
  position: relative;
}

.about-article hr::after {
  content: "♦";
  color: var(--accent, #E0A526);
  font-size: 0.9rem;
  letter-spacing: 0.75rem;
  display: inline-block;
  opacity: 0.85;
}

/* Tables (Section 6.7) */
.about-article table {
  width: 100%;
  border-collapse: collapse;
  margin: 2rem 0;
  font-size: 0.95rem;
}

.about-article th,
.about-article td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-subtle, rgba(110, 5, 22, 0.12));
  text-align: left;
}

.about-article th {
  font-family: var(--font-serif, "Cinzel", Georgia, serif);
  font-weight: 600;
  color: var(--heading-color, #6E0516);
  background-color: var(--bg-secondary, #F2DFB4);
}

/* Fallback image safety net inside article (Section 6.8) */
.about-article img {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin: 2rem auto;
  display: block;
}

.about-article figcaption {
  font-size: 0.875rem;
  color: var(--text-muted);
  text-align: center;
  margin-top: 0.5rem;
}

/* ----------------------------------------------------
   DARK MODE OVERRIDES (Section 10)
---------------------------------------------------- */
.about-article.is-dark,
.about-article.is-dark p,
html[data-theme="dark"] .about-article,
html[data-theme="dark"] .about-article p,
html.dark .about-article,
html.dark .about-article p,
.about-page.is-dark .about-article,
.about-page.is-dark .about-article p {
  color: var(--ivory, #F3EBDD) !important;
}

.about-article.is-dark h2,
.about-article.is-dark h3,
html[data-theme="dark"] .about-article h2,
html[data-theme="dark"] .about-article h3,
html.dark .about-article h2,
html.dark .about-article h3,
.about-page.is-dark .about-article h2,
.about-page.is-dark .about-article h3 {
  color: var(--ivory, #F3EBDD) !important;
}

.about-article.is-dark strong,
html[data-theme="dark"] .about-article strong,
html.dark .about-article strong,
.about-page.is-dark .about-article strong {
  color: #FFFFFF !important;
}

.about-article.is-dark blockquote,
html[data-theme="dark"] .about-article blockquote,
html.dark .about-article blockquote,
.about-page.is-dark .about-article blockquote {
  color: rgba(243, 235, 221, 0.88) !important;
}

.about-article.is-dark blockquote::before,
html[data-theme="dark"] .about-article blockquote::before,
html.dark .about-article blockquote::before,
.about-page.is-dark .about-article blockquote::before {
  background-color: var(--accent, #D7263D) !important;
}

.about-article.is-dark blockquote cite,
.about-article.is-dark blockquote footer,
html[data-theme="dark"] .about-article blockquote cite,
html[data-theme="dark"] .about-article blockquote footer,
html.dark .about-article blockquote cite,
html.dark .about-article blockquote footer,
.about-page.is-dark .about-article blockquote cite,
.about-page.is-dark .about-article blockquote footer {
  color: var(--accent-text, #E6B34A) !important;
}

.about-article.is-dark a,
html[data-theme="dark"] .about-article a,
html.dark .about-article a,
.about-page.is-dark .about-article a {
  color: var(--accent-text, #E6B34A) !important;
}

.about-article.is-dark li,
html[data-theme="dark"] .about-article li,
html.dark .about-article li,
.about-page.is-dark .about-article li {
  color: var(--ivory, #F3EBDD) !important;
}

.about-article.is-dark li::marker,
html[data-theme="dark"] .about-article li::marker,
html.dark .about-article li::marker,
.about-page.is-dark .about-article li::marker {
  color: var(--accent, #D7263D) !important;
}

.about-article.is-dark:lang(en) > p:first-of-type::first-letter,
html[data-theme="dark"] .about-article:lang(en) > p:first-of-type::first-letter,
html.dark .about-article:lang(en) > p:first-of-type::first-letter,
.about-page.is-dark .about-article:lang(en) > p:first-of-type::first-letter {
  color: var(--accent, #D7263D) !important;
}
</style>
