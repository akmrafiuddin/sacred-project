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

const { dailySchedule } = useTempleData();
</script>

<template>
  <!-- ================================================================= -->
  <!-- VARIANT 1: CLASSIC (Vertical Chronological Timeline Flow)         -->
  <!-- ================================================================= -->
  <section
    v-if="variant === 'classic'"
    id="daily-schedule"
    class="schedule-section"
    aria-label="Daily Schedule of Temple Rituals"
  >
    <div class="schedule-layout">
      <!-- LEFT COLUMN: Sticky Description & Context -->
      <div class="schedule-left">
        <div class="schedule-left-sticky">
          <span class="section-badge">Daily Schedule</span>
          <h2 class="section-title">How our day is offered to Mother</h2>
          <p class="section-subtitle">
            From the first morning bell to the peaceful night closing, experience the daily flow of darshan, aarti, and sacred offerings.
          </p>
        </div>
      </div>

      <!-- RIGHT COLUMN: Chronological Timeline Flow -->
      <div class="schedule-right">
        <div class="schedule-flow">
          <div
            v-for="(event, idx) in dailySchedule"
            :key="event.time"
            class="flow-item"
          >
            <!-- Left: Time -->
            <div class="flow-time">
              <span>{{ event.time }}</span>
            </div>

            <!-- Center: Timeline Node & Connecting Line -->
            <div class="flow-track" aria-hidden="true">
              <span class="track-dot"></span>
              <span v-if="idx < dailySchedule.length - 1" class="track-line"></span>
            </div>

            <!-- Right: Event Title & Description -->
            <div class="flow-body">
              <h3 class="event-title">{{ event.title }}</h3>
              <p class="event-description">{{ event.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ================================================================= -->
  <!-- VARIANT 2: KESARI (Horizontal Milestone Timeline Flow)            -->
  <!-- ================================================================= -->
  <section
    v-else
    id="alt-schedule"
    class="alt-section"
    aria-label="Daily Schedule of Temple Rituals"
  >
    <div class="alt-container">
      <div class="section-heading-center">
        <span class="kesari-badge">Sacred Rhythm</span>
        <h2 class="section-title">The Sacred Rhythm of the Day</h2>
        <p class="section-subtitle">
          From the first morning bell to the peaceful night closing, experience the daily flow of darshan, aarti, and sacred offerings.
        </p>
      </div>

      <!-- Horizontal Milestone Timeline Scroller -->
      <div class="horizontal-timeline-wrap">
        <div class="timeline-scroller">
          <div class="milestone-timeline">
            <!-- 1. Central Axis Line (runs through vertical center of the section) -->
            <div class="timeline-axis" aria-hidden="true"></div>

            <!-- 2. 5 Evenly Spaced Nodes with alternating top/bottom content -->
            <div class="timeline-nodes-track">
              <div
                v-for="(event, idx) in dailySchedule"
                :key="event.step"
                class="timeline-milestone"
                :class="{ 'is-top': idx % 2 === 0, 'is-bottom': idx % 2 === 1 }"
              >
                <!-- TOP SLOT (Above Axis) -->
                <div class="milestone-slot slot-top">
                  <!-- Node 0, 2, 4 (Even): Label is directly ABOVE the node -->
                  <div v-if="idx % 2 === 0" class="milestone-label-block label-top">
                    <span class="milestone-step">STEP {{ event.step }}</span>
                    <span class="milestone-time">{{ event.time }}</span>
                    <h3 class="milestone-title">{{ event.title }}</h3>
                  </div>

                  <!-- Node 1, 3 (Odd): Description + Stem is ABOVE the node -->
                  <div v-else class="milestone-desc-block desc-top">
                    <p class="milestone-desc">{{ event.description }}</p>
                    <div class="milestone-stem stem-up" aria-hidden="true">
                      <span class="stem-dot"></span>
                      <span class="stem-line"></span>
                    </div>
                  </div>
                </div>

                <!-- CENTER NODE MARKER: Double circle sitting on top of the axis line -->
                <div class="milestone-node-wrap">
                  <div class="double-circle-node" :aria-label="`${event.time} - ${event.title}`">
                    <span class="node-ring" aria-hidden="true"></span>
                    <span class="node-dot" aria-hidden="true"></span>
                  </div>
                </div>

                <!-- BOTTOM SLOT (Below Axis) -->
                <div class="milestone-slot slot-bottom">
                  <!-- Node 0, 2, 4 (Even): Stem + Description is BELOW the node -->
                  <div v-if="idx % 2 === 0" class="milestone-desc-block desc-bottom">
                    <div class="milestone-stem stem-down" aria-hidden="true">
                      <span class="stem-line"></span>
                      <span class="stem-dot"></span>
                    </div>
                    <p class="milestone-desc">{{ event.description }}</p>
                  </div>

                  <!-- Node 1, 3 (Odd): Label is directly BELOW the node -->
                  <div v-else class="milestone-label-block label-bottom">
                    <span class="milestone-time">{{ event.time }}</span>
                    <h3 class="milestone-title">{{ event.title }}</h3>
                    <span class="milestone-step">STEP {{ event.step }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Scroll Indicator Hint -->
        <div class="mobile-scroll-hint" aria-hidden="true">
          <span>Scroll horizontally for full daily rituals</span>
          <span class="hint-arrow">&rarr;</span>
        </div>
      </div>

      <p class="schedule-footnote">
        Devotees are welcome to participate in all daily aartis and receive sanctified prasad throughout the day.
      </p>
    </div>
  </section>
</template>

<style scoped>
/* ----------------------------------------------------
   CLASSIC SCHEDULE (Layout 1)
---------------------------------------------------- */
.schedule-section {
  width: 100%;
  padding: 6.5rem 1.5rem;
  background-color: var(--bg-primary);
  position: relative;
}

.schedule-layout {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 3.5rem;
}

@media (min-width: 900px) {
  .schedule-layout {
    grid-template-columns: 380px 1fr;
    gap: 4.5rem;
  }
}

.schedule-left-sticky {
  position: sticky;
  top: 6rem;
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
  margin-bottom: 1.25rem;
}

.section-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.65;
  margin-bottom: 2rem;
}

.section-note {
  padding: 1.15rem 1.35rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--accent);
  border-radius: 8px;
  font-size: 0.885rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Timeline Flow */
.schedule-flow {
  display: flex;
  flex-direction: column;
}

.flow-item {
  display: flex;
  gap: 1.5rem;
  min-height: 110px;
  position: relative;
}

@media (max-width: 640px) {
  .schedule-section {
    padding: 4rem 1.25rem;
  }

  .flow-item {
    gap: 0.85rem;
    min-height: 95px;
  }

  .flow-time {
    width: 72px !important;
  }

  .flow-time span {
    font-size: 0.825rem !important;
  }

  .event-title {
    font-size: 1.1rem !important;
  }

  .event-description {
    font-size: 0.85rem !important;
  }
}

.flow-time {
  width: 90px;
  flex-shrink: 0;
  text-align: right;
  padding-top: 0.15rem;
}

.flow-time span {
  font-size: 0.925rem;
  font-weight: 700;
  color: var(--accent-text);
  letter-spacing: -0.01em;
}

.flow-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  width: 16px;
}

.track-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg-primary);
  box-shadow: 0 0 0 2px var(--accent);
  margin-top: 0.35rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 2;
}

.flow-item:hover .track-dot {
  transform: scale(1.25);
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.45);
}

.track-line {
  width: 2px;
  flex: 1;
  background: var(--border-color);
  margin-top: 0.35rem;
}

html[data-theme="light"] .track-line {
  background: var(--border-color);
}

.flow-body {
  flex: 1;
  padding-left: 0.5rem;
  padding-top: 0.05rem;
}

.event-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.25;
  margin-bottom: 0.4rem;
  letter-spacing: -0.015em;
}

.event-description {
  font-size: 0.925rem;
  color: var(--text-secondary);
  line-height: 1.6;
  max-width: 520px;
}

/* ----------------------------------------------------
   KESARI SCHEDULE (Layout 2)
---------------------------------------------------- */
.alt-section {
  width: 100%;
  background-color: var(--bg-primary);
  padding: 6.5rem 2rem;
  position: relative;
}

@media (max-width: 640px) {
  .alt-section {
    padding: 4rem 1.25rem;
  }
}

.alt-container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.section-heading-center {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 3.75rem;
}

@media (max-width: 640px) {
  .section-heading-center {
    margin-bottom: 2.25rem;
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
  margin-bottom: 1.15rem;
}

/* ----------------------------------------------------
   HORIZONTAL MILESTONE TIMELINE (Layout 2)
---------------------------------------------------- */
.horizontal-timeline-wrap {
  width: 100%;
  position: relative;
  margin: 1.5rem 0 2rem;
}

.timeline-scroller {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  scroll-snap-type: x proximity;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
  padding: 1.5rem 0;
}

.timeline-scroller::-webkit-scrollbar {
  display: none; /* WebKit */
}

.milestone-timeline {
  position: relative;
  width: 100%;
  min-width: 960px;
  height: 350px;
}

/* 1. Central Axis Line (1px deep navy/blue through vertical center) */
.timeline-axis {
  position: absolute;
  top: 50%;
  left: 6%;
  right: 6%;
  height: 1px;
  background-color: var(--border-color); /* #1e2e4a in dark theme, #e5ded2 in light */
  transform: translateY(-50%);
  z-index: 1;
}

/* 2. 5 Evenly Spaced Nodes Grid */
.timeline-nodes-track {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  width: 100%;
  height: 100%;
}

.timeline-milestone {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 0 0.5rem;
  cursor: default;
  transition: transform 0.25s ease;
  scroll-snap-align: center;
}

/* Slots for alternating top/bottom content */
.milestone-slot {
  width: 100%;
  height: 155px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.slot-top {
  align-items: flex-end;
  padding-bottom: 0.85rem;
}

.slot-bottom {
  align-items: flex-start;
  padding-top: 0.85rem;
}

/* 3. Center Node: Double Circle sitting directly on the axis */
.milestone-node-wrap {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 3;
}

.double-circle-node {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-primary); /* Masks out the axis line with page background */
  border: 1.5px solid var(--kesari, #ea580c);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.double-circle-node .node-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--kesari, #ea580c);
  transition: transform 0.3s ease, background-color 0.3s ease;
}

/* Hover highlights */
.timeline-milestone:hover .double-circle-node {
  transform: scale(1.18);
  border-color: var(--kesari-light, #fb923c);
  box-shadow: 0 0 16px rgba(234, 88, 12, 0.45);
}

.timeline-milestone:hover .node-dot {
  background: var(--kesari-light, #fb923c);
}

.timeline-milestone:hover .milestone-time {
  color: var(--kesari-light, #fb923c);
}

.timeline-milestone:hover .stem-dot {
  background-color: var(--kesari, #ea580c);
  transform: scale(1.35);
}

/* 4. Year/Ritual Label Block */
.milestone-label-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.2rem;
}

.label-top {
  justify-content: flex-end;
}

.label-bottom {
  justify-content: flex-start;
}

.milestone-step {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  opacity: 0.85;
}

.milestone-time {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--kesari, #ea580c);
  letter-spacing: -0.01em;
  line-height: 1.2;
  transition: color 0.2s ease;
}

.milestone-title {
  font-size: 0.975rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.25;
  margin: 0;
}

/* 5. Description Block & Stem Connector */
.milestone-desc-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.desc-top {
  gap: 10px;
  justify-content: flex-end;
}

.desc-bottom {
  gap: 10px;
  justify-content: flex-start;
}

.milestone-desc {
  font-size: 0.825rem;
  font-weight: 400;
  color: var(--text-secondary);
  line-height: 1.5;
  text-align: center;
  max-width: 185px;
  margin: 0 auto;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Stem: vertical connector ending in small gray dot */
.milestone-stem {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stem-line {
  width: 1px;
  height: 32px;
  background-color: var(--text-muted);
  opacity: 0.45;
}

.stem-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--text-muted);
  opacity: 0.85;
  transition: all 0.2s ease;
}

/* Mobile Scroll Hint */
.mobile-scroll-hint {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-top: 0.75rem;
}

.hint-arrow {
  color: var(--kesari, #ea580c);
  font-weight: 800;
}

@media (max-width: 960px) {
  .mobile-scroll-hint {
    display: flex;
  }
}

.schedule-footnote {
  text-align: center;
  margin-top: 2.75rem;
  font-size: 0.925rem;
  color: var(--text-muted);
}
</style>
