<script setup lang="ts">
import { useAboutData } from "~/composables/useAboutData";

const { hero, history, pillars, shrines, administration, guidelines } = useAboutData();

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
  <div class="about-page">
    <!-- 1. Breadcrumb Bar -->
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <div class="about-container">
        <ol class="breadcrumb-list">
          <li class="breadcrumb-item">
            <NuxtLink to="/" class="breadcrumb-link">Home</NuxtLink>
          </li>
          <li class="breadcrumb-separator" aria-hidden="true">/</li>
          <li class="breadcrumb-item active" aria-current="page">About Us</li>
        </ol>
      </div>
    </nav>

    <!-- 2. Hero Section -->
    <header class="about-hero">
      <div class="about-container hero-inner">
        <div class="hero-badge">
          <span class="badge-dot" aria-hidden="true"></span>
          <span>{{ hero.badge }}</span>
        </div>

        <h1 class="hero-title">
          <span class="bengali-title">{{ hero.titleBn }}</span>
          <span class="english-title">{{ hero.titleEn }}</span>
        </h1>

        <p class="hero-subtitle">
          {{ hero.subtitle }}
        </p>

        <!-- Highlights Strip -->
        <div class="hero-highlights-strip" aria-label="Temple Highlights">
          <div
            v-for="(highlight, idx) in hero.highlights"
            :key="idx"
            class="highlight-chip"
          >
            <span class="highlight-dot" aria-hidden="true"></span>
            <span>{{ highlight }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 3. Sacred History & Legend Section -->
    <section class="about-section history-section" aria-labelledby="history-heading">
      <div class="about-container">
        <div class="section-tag-center">
          <span class="section-tag">{{ history.tag }}</span>
        </div>

        <div class="history-grid">
          <!-- Left Column: Narrative & Proverb -->
          <div class="history-text-col">
            <div class="history-titles">
              <h2 id="history-heading" class="section-heading">{{ history.heading }}</h2>
              <span class="section-heading-bn">{{ history.headingBn }}</span>
            </div>

            <!-- Sacred Pull Quote -->
            <blockquote class="sacred-quote">
              <p class="quote-text">“{{ history.quote }}”</p>
              <footer class="quote-author">— {{ history.quoteAuthor }}</footer>
            </blockquote>

            <!-- Story Paragraphs -->
            <div class="narrative-body">
              <p
                v-for="(para, idx) in history.narrativeParagraphs"
                :key="idx"
                class="narrative-paragraph"
              >
                {{ para }}
              </p>
            </div>
          </div>

          <!-- Right Column: Timeline / Milestones -->
          <div class="history-milestones-col">
            <div class="milestones-card">
              <h3 class="milestones-header">Historical Milestones</h3>
              <div class="milestones-timeline">
                <div
                  v-for="(milestone, idx) in history.milestones"
                  :key="idx"
                  class="milestone-item"
                >
                  <div class="milestone-period-badge">{{ milestone.period }}</div>
                  <h4 class="milestone-title">{{ milestone.title }}</h4>
                  <p class="milestone-desc">{{ milestone.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Spiritual Mission & Core Pillars Section -->
    <section class="about-section pillars-section" aria-labelledby="pillars-heading">
      <div class="about-container">
        <div class="section-header-center">
          <span class="section-tag">Core Values &amp; Spiritual Mission</span>
          <h2 id="pillars-heading" class="section-heading">Four Sacred Pillars of Golpahar</h2>
          <span class="section-heading-bn">আমাদের মূল নীতি ও সেবামূলক দর্শন</span>
          <p class="section-desc-center">
            Guiding every morning aarti, community prasad distribution, and spiritual ritual at the holy hill of Chittagong.
          </p>
        </div>

        <div class="pillars-grid">
          <div
            v-for="pillar in pillars"
            :key="pillar.id"
            class="pillar-card"
          >
            <div class="pillar-header">
              <span class="pillar-title-bn">{{ pillar.titleBn }}</span>
              <h3 class="pillar-title">{{ pillar.title }}</h3>
            </div>
            <p class="pillar-desc">{{ pillar.description }}</p>
            <div class="pillar-footer">
              <span class="pillar-emphasis-pill">{{ pillar.emphasis }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. Temple Complex & Shrines Section -->
    <section class="about-section shrines-section" aria-labelledby="shrines-heading">
      <div class="about-container">
        <div class="section-header-center">
          <span class="section-tag">Sanctified Complex</span>
          <h2 id="shrines-heading" class="section-heading">Sacred Shrines &amp; Mandir Pavilions</h2>
          <span class="section-heading-bn">পবিত্র মন্দির চত্বর ও দর্শনীয় স্থানসমূহ</span>
          <p class="section-desc-center">
            A harmonious spiritual compound designed for deep meditation, heartfelt prayer, and communal fellowship.
          </p>
        </div>

        <div class="shrines-grid">
          <div
            v-for="shrine in shrines"
            :key="shrine.id"
            class="shrine-card"
          >
            <div class="shrine-header">
              <span class="shrine-bn">{{ shrine.nameBn }}</span>
              <h3 class="shrine-name">{{ shrine.name }}</h3>
            </div>
            <p class="shrine-desc">{{ shrine.description }}</p>
            <div class="shrine-significance-box">
              <span class="significance-label">Significance:</span>
              <p class="significance-text">{{ shrine.significance }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. Governance & Administration Section -->
    <section class="about-section admin-section" aria-labelledby="admin-heading">
      <div class="about-container">
        <div class="admin-card">
          <div class="admin-header">
            <div>
              <span class="section-tag">{{ administration.titleBn }}</span>
              <h2 id="admin-heading" class="admin-title">{{ administration.title }}</h2>
              <span class="committee-badge">{{ administration.committeeName }}</span>
            </div>
          </div>

          <p class="admin-description">
            {{ administration.description }}
          </p>

          <div class="responsibilities-box">
            <h3 class="responsibilities-title">Core Mandir Responsibilities</h3>
            <ul class="responsibilities-list">
              <li
                v-for="(resp, idx) in administration.keyResponsibilities"
                :key="idx"
                class="responsibility-item"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" class="check-icon" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>{{ resp }}</span>
              </li>
            </ul>
          </div>

          <div class="admin-footer-bar">
            <span class="trust-pill-text">{{ administration.registrationInfo }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. Devotee Guidelines Section -->
    <section class="about-section guidelines-section" aria-labelledby="guidelines-heading">
      <div class="about-container">
        <div class="section-header-center">
          <span class="section-tag">Pilgrim Etiquette</span>
          <h2 id="guidelines-heading" class="section-heading">Guidelines for Visiting Pilgrims</h2>
          <span class="section-heading-bn">মন্দিরে আগত দর্শনার্থীদের শিষ্টাচার ও নিয়মাবলী</span>
          <p class="section-desc-center">
            To preserve the divine serenity and scriptural sanctity of the temple premises, we kindly request all visitors to observe these guidelines.
          </p>
        </div>

        <div class="guidelines-grid">
          <div
            v-for="(g, idx) in guidelines"
            :key="idx"
            class="guideline-card"
          >
            <div class="guideline-number-badge">{{ (idx + 1).toString().padStart(2, '0') }}</div>
            <h3 class="guideline-title">{{ g.title }}</h3>
            <p class="guideline-rule">{{ g.rule }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 8. Call to Action Banner -->
    <section class="about-cta-section" aria-label="Visit Temple Invitation">
      <div class="about-container">
        <div class="cta-inner-card">
          <span class="cta-badge">জয় মা কালী</span>
          <h2 class="cta-title">Experience the Divine Grace of Mother Kali</h2>
          <p class="cta-desc">
            Whether participating in the daily Mangal Aarti, seeking Sankalpa blessings, or partaking in the afternoon Annadanam Mahaprasad, your presence is warmly welcomed at Golpahar.
          </p>

          <div class="cta-actions">
            <NuxtLink to="/contact" class="btn btn-cta-primary">
              <span>Plan Your Visit / Contact Desk</span>
              <svg viewBox="0 0 20 20" fill="currentColor" class="cta-arrow" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </NuxtLink>

            <NuxtLink to="/puja-and-rituals" class="btn btn-cta-secondary">
              <span>Explore Pujas &amp; Rituals</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* --------------------------------------------------------------------------
   ABOUT PAGE DESIGN SYSTEM (Palette A: Sindoor & Gold / Cream Ground)
   Adheres to WCAG AA Contrast, authentic temple typography, clean card layout
-------------------------------------------------------------------------- */

.about-page {
  width: 100%;
  min-height: 80vh;
  background-color: var(--bg-primary, #F7EFE0);
  color: var(--text-primary, #2B1A17);
  padding-bottom: 5rem;
}

.about-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Breadcrumb Navigation */
.breadcrumb-nav {
  padding: 1.25rem 0 0.5rem;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-muted, rgba(43, 26, 23, 0.6));
}

.breadcrumb-link {
  color: var(--maroon, #6E0516);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.15s ease;
}

.breadcrumb-link:hover {
  color: var(--gold, #E0A526);
  text-decoration: underline;
}

.breadcrumb-separator {
  color: var(--border-color, rgba(224, 165, 38, 0.45));
}

.breadcrumb-item.active {
  color: var(--text-primary, #2B1A17);
  font-weight: 500;
}

/* Hero Header */
.about-hero {
  padding: 2.25rem 0 3.5rem;
  text-align: center;
  position: relative;
}

.hero-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 860px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 1rem;
  background-color: rgba(110, 5, 22, 0.08);
  border: 1px solid var(--border-color, rgba(224, 165, 38, 0.45));
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--maroon, #6E0516);
  margin-bottom: 1.25rem;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--gold, #E0A526);
}

.hero-title {
  margin: 0 0 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.bengali-title {
  font-family: inherit;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--gold, #E0A526);
  letter-spacing: 0.02em;
}

.english-title {
  font-family: "Cinzel", Georgia, serif;
  font-size: 2.75rem;
  font-weight: 800;
  color: var(--maroon, #6E0516);
  line-height: 1.18;
  letter-spacing: -0.01em;
}

@media (max-width: 640px) {
  .english-title {
    font-size: 2.15rem;
  }
}

.hero-subtitle {
  font-size: 1.0625rem;
  line-height: 1.65;
  color: var(--text-secondary, rgba(43, 26, 23, 0.78));
  margin: 0 0 2rem;
  max-width: 720px;
}

/* Highlights Strip */
.hero-highlights-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.highlight-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.15rem;
  background: var(--bg-card, #FFFFFF);
  border: 1px solid var(--border-color, rgba(224, 165, 38, 0.45));
  border-radius: 9999px;
  font-size: 0.825rem;
  font-weight: 700;
  color: var(--text-primary, #2B1A17);
  box-shadow: 0 2px 8px rgba(110, 5, 22, 0.03);
}

.highlight-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--maroon, #6E0516);
}

/* General Section Styles */
.about-section {
  padding: 4rem 0;
  border-top: 1px solid var(--border-subtle, rgba(110, 5, 22, 0.08));
}

.section-tag-center {
  text-align: center;
  margin-bottom: 0.5rem;
}

.section-tag {
  display: inline-block;
  font-size: 0.8125rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--maroon, #6E0516);
}

.section-heading {
  font-family: "Cinzel", Georgia, serif;
  font-size: 2.15rem;
  font-weight: 800;
  color: var(--maroon, #6E0516);
  margin: 0.35rem 0 0.25rem;
  line-height: 1.25;
}

.section-heading-bn {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: var(--gold, #E0A526);
  margin-bottom: 0.75rem;
}

.section-header-center {
  text-align: center;
  max-width: 760px;
  margin: 0 auto 3rem;
}

.section-desc-center {
  font-size: 0.975rem;
  line-height: 1.6;
  color: var(--text-secondary, rgba(43, 26, 23, 0.75));
  margin: 0.5rem 0 0;
}

/* 3. History Section */
.history-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 3rem;
  align-items: start;
  margin-top: 1.5rem;
}

@media (max-width: 900px) {
  .history-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
}

.history-titles {
  margin-bottom: 1.5rem;
}

.sacred-quote {
  margin: 0 0 1.75rem;
  padding: 1.25rem 1.5rem;
  background: rgba(224, 165, 38, 0.12);
  border-left: 4px solid var(--gold, #E0A526);
  border-radius: 0 8px 8px 0;
}

.quote-text {
  font-family: "Cinzel", Georgia, serif;
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--maroon, #6E0516);
  font-style: italic;
  margin: 0 0 0.5rem;
}

.quote-author {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-muted, rgba(43, 26, 23, 0.65));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.narrative-body {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.narrative-paragraph {
  font-size: 0.975rem;
  line-height: 1.7;
  color: var(--text-primary, #2B1A17);
  margin: 0;
}

/* History Milestones Card */
.milestones-card {
  background: var(--bg-card, #FFFFFF);
  border: 1.5px solid var(--border-color, rgba(224, 165, 38, 0.45));
  border-radius: 14px;
  padding: 2rem;
  box-shadow: 0 6px 20px rgba(110, 5, 22, 0.04);
}

.milestones-header {
  font-family: "Cinzel", Georgia, serif;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--maroon, #6E0516);
  margin: 0 0 1.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-subtle, rgba(110, 5, 22, 0.1));
}

.milestones-timeline {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
}

.milestone-item {
  position: relative;
  padding-left: 1.25rem;
  border-left: 2px solid var(--gold, #E0A526);
}

.milestone-period-badge {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  background: rgba(110, 5, 22, 0.07);
  border: 1px solid var(--border-color, rgba(224, 165, 38, 0.45));
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--maroon, #6E0516);
  margin-bottom: 0.4rem;
}

.milestone-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary, #2B1A17);
  margin: 0 0 0.35rem;
}

.milestone-desc {
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--text-secondary, rgba(43, 26, 23, 0.75));
  margin: 0;
}

/* 4. Pillars Section */
.pillars-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.75rem;
}

@media (max-width: 768px) {
  .pillars-grid {
    grid-template-columns: 1fr;
  }
}

.pillar-card {
  background: var(--bg-card, #FFFFFF);
  border: 1px solid var(--border-color, rgba(224, 165, 38, 0.45));
  border-radius: 12px;
  padding: 1.75rem;
  box-shadow: 0 4px 16px rgba(110, 5, 22, 0.03);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pillar-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(110, 5, 22, 0.08);
}

.pillar-header {
  margin-bottom: 0.75rem;
}

.pillar-title-bn {
  display: block;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--gold, #E0A526);
  margin-bottom: 0.25rem;
}

.pillar-title {
  font-family: "Cinzel", Georgia, serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--maroon, #6E0516);
  margin: 0;
  line-height: 1.3;
}

.pillar-desc {
  font-size: 0.925rem;
  line-height: 1.6;
  color: var(--text-secondary, rgba(43, 26, 23, 0.75));
  margin: 0 0 1.25rem;
  flex-grow: 1;
}

.pillar-emphasis-pill {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  background: rgba(110, 5, 22, 0.06);
  border: 1px solid var(--border-subtle, rgba(110, 5, 22, 0.15));
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--maroon, #6E0516);
  letter-spacing: 0.02em;
}

/* 5. Shrines Section */
.shrines-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.75rem;
}

@media (max-width: 768px) {
  .shrines-grid {
    grid-template-columns: 1fr;
  }
}

.shrine-card {
  background: var(--bg-card, #FFFFFF);
  border: 1px solid var(--border-color, rgba(224, 165, 38, 0.45));
  border-radius: 12px;
  padding: 1.85rem;
  box-shadow: 0 4px 16px rgba(110, 5, 22, 0.03);
}

.shrine-header {
  margin-bottom: 0.75rem;
}

.shrine-bn {
  display: block;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--gold, #E0A526);
  margin-bottom: 0.2rem;
}

.shrine-name {
  font-family: "Cinzel", Georgia, serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--maroon, #6E0516);
  margin: 0;
  line-height: 1.3;
}

.shrine-desc {
  font-size: 0.925rem;
  line-height: 1.6;
  color: var(--text-primary, #2B1A17);
  margin: 0 0 1.25rem;
}

.shrine-significance-box {
  padding: 0.75rem 1rem;
  background: rgba(224, 165, 38, 0.09);
  border-left: 3px solid var(--gold, #E0A526);
  border-radius: 0 6px 6px 0;
}

.significance-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--maroon, #6E0516);
  margin-bottom: 0.2rem;
}

.significance-text {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-secondary, rgba(43, 26, 23, 0.8));
  margin: 0;
}

/* 6. Administration Section */
.admin-card {
  background: var(--bg-card, #FFFFFF);
  border: 1.5px solid var(--border-color, rgba(224, 165, 38, 0.5));
  border-radius: 14px;
  padding: 2.5rem;
  box-shadow: 0 6px 24px rgba(110, 5, 22, 0.04);
}

@media (max-width: 640px) {
  .admin-card {
    padding: 1.75rem;
  }
}

.admin-header {
  margin-bottom: 1.25rem;
}

.admin-title {
  font-family: "Cinzel", Georgia, serif;
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--maroon, #6E0516);
  margin: 0.25rem 0 0.5rem;
  line-height: 1.25;
}

.committee-badge {
  display: inline-block;
  padding: 0.35rem 0.95rem;
  background: rgba(110, 5, 22, 0.07);
  border: 1px solid var(--border-color, rgba(224, 165, 38, 0.45));
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--maroon, #6E0516);
  margin-top: 0.25rem;
}

.admin-description {
  font-size: 1rem;
  line-height: 1.65;
  color: var(--text-primary, #2B1A17);
  margin: 0 0 1.75rem;
}

.responsibilities-box {
  background: rgba(110, 5, 22, 0.02);
  border: 1px solid var(--border-subtle, rgba(110, 5, 22, 0.12));
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.responsibilities-title {
  font-size: 0.9375rem;
  font-weight: 800;
  color: var(--maroon, #6E0516);
  margin: 0 0 1rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.responsibilities-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.responsibility-item {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  font-size: 0.925rem;
  line-height: 1.5;
  color: var(--text-primary, #2B1A17);
}

.check-icon {
  width: 18px;
  height: 18px;
  color: #16A34A;
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.admin-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle, rgba(110, 5, 22, 0.1));
}

.trust-pill-text {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-muted, rgba(43, 26, 23, 0.65));
}

/* 7. Guidelines Section */
.guidelines-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .guidelines-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .guidelines-grid {
    grid-template-columns: 1fr;
  }
}

.guideline-card {
  background: var(--bg-card, #FFFFFF);
  border: 1px solid var(--border-color, rgba(224, 165, 38, 0.45));
  border-radius: 10px;
  padding: 1.5rem;
  position: relative;
  box-shadow: 0 2px 10px rgba(110, 5, 22, 0.02);
}

.guideline-number-badge {
  font-family: "Cinzel", Georgia, serif;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--gold, #E0A526);
  margin-bottom: 0.5rem;
}

.guideline-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--maroon, #6E0516);
  margin: 0 0 0.5rem;
}

.guideline-rule {
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--text-secondary, rgba(43, 26, 23, 0.75));
  margin: 0;
}

/* 8. CTA Section */
.about-cta-section {
  padding-top: 1rem;
}

.cta-inner-card {
  background: linear-gradient(135deg, var(--maroon, #6E0516) 0%, var(--maroon-deep, #3F0A12) 100%);
  border: 1.5px solid var(--gold, #E0A526);
  border-radius: 16px;
  padding: 3.5rem 2rem;
  text-align: center;
  color: #FFFFFF;
  box-shadow: 0 10px 30px rgba(110, 5, 22, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cta-badge {
  display: inline-block;
  padding: 0.35rem 1rem;
  background: rgba(224, 165, 38, 0.2);
  border: 1px solid var(--gold, #E0A526);
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--gold, #E0A526);
  margin-bottom: 1rem;
}

.cta-title {
  font-family: "Cinzel", Georgia, serif;
  font-size: 2.25rem;
  font-weight: 800;
  color: #FFFFFF;
  margin: 0 0 1rem;
  line-height: 1.25;
  max-width: 680px;
}

@media (max-width: 640px) {
  .cta-title {
    font-size: 1.75rem;
  }
}

.cta-desc {
  font-size: 1.05rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 2rem;
  max-width: 620px;
}

.cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.btn-cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.75rem;
  background: var(--gold, #E0A526);
  color: #2B1A17;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 800;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
}

.btn-cta-primary:hover {
  background: #EBB644;
  transform: translateY(-1px);
}

.cta-arrow {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

.btn-cta-primary:hover .cta-arrow {
  transform: translateX(3px);
}

.btn-cta-secondary {
  display: inline-flex;
  align-items: center;
  padding: 0.85rem 1.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  color: #FFFFFF;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-cta-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #FFFFFF;
}
</style>
