<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useTempleData, type SpecialEvent } from "~/composables/useTempleData";

const props = withDefaults(
  defineProps<{
    variant?: "default" | "kesari";
  }>(),
  {
    variant: "default",
  }
);

// ---------------------------------------------------------------------------
// Dynamic Admin-managed Special Events & Festivals
// ---------------------------------------------------------------------------
const { specialEvents } = useTempleData();
const specialEventsData = computed<SpecialEvent[]>(() => specialEvents.value || []);

// ---------------------------------------------------------------------------
// Calendar State
// ---------------------------------------------------------------------------
const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth()); // 0-indexed
const selectedDate = ref(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

const isLoading = ref(false);
const hasError = ref(false);

const detailPanelRef = ref<HTMLElement | null>(null);
const dayButtonRefs = ref<(HTMLButtonElement | null)[]>([]);

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---------------------------------------------------------------------------
// Calendar Computations
// ---------------------------------------------------------------------------
const currentMonthLabel = computed(() => {
  return `${monthNames[currentMonth.value]} ${currentYear.value}`;
});

// Month length computed from date (28/29/30/31 days), not hard-coded
const daysInCurrentMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

// Leading blank cells align day 1 to the correct weekday
const leadingBlanksCount = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay();
});

// Check if a given day is today
function isTodayDate(day: number): boolean {
  return (
    today.getFullYear() === currentYear.value &&
    today.getMonth() === currentMonth.value &&
    today.getDate() === day
  );
}

// Check if a given day is selected
function isSelectedDate(day: number): boolean {
  return (
    selectedDate.value.getFullYear() === currentYear.value &&
    selectedDate.value.getMonth() === currentMonth.value &&
    selectedDate.value.getDate() === day
  );
}

// Format date key YYYY-MM-DD
function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

// Check if a day has special events
function dayHasEvents(day: number): boolean {
  const key = formatDateKey(currentYear.value, currentMonth.value, day);
  return (specialEventsData.value || []).some((e: SpecialEvent) => e.dateStr === key);
}

// Special events for selected date
const specialEventsForSelectedDate = computed(() => {
  const key = formatDateKey(
    selectedDate.value.getFullYear(),
    selectedDate.value.getMonth(),
    selectedDate.value.getDate()
  );
  return (specialEventsData.value || []).filter((e: SpecialEvent) => e.dateStr === key);
});

// Formatted display string for selected date
const formattedSelectedDate = computed(() => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  return selectedDate.value.toLocaleDateString("en-US", options);
});

// Whether selected date is today
const isSelectedDateToday = computed(() => {
  return (
    today.getFullYear() === selectedDate.value.getFullYear() &&
    today.getMonth() === selectedDate.value.getMonth() &&
    today.getDate() === selectedDate.value.getDate()
  );
});

// ---------------------------------------------------------------------------
// Calendar Navigation Actions
// ---------------------------------------------------------------------------
function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value -= 1;
  } else {
    currentMonth.value -= 1;
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value += 1;
  } else {
    currentMonth.value += 1;
  }
}

function goToToday() {
  currentYear.value = today.getFullYear();
  currentMonth.value = today.getMonth();
  selectedDate.value = new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

// ---------------------------------------------------------------------------
// Day Selection & Mobile Scroll
// ---------------------------------------------------------------------------
function selectDay(day: number) {
  selectedDate.value = new Date(currentYear.value, currentMonth.value, day);

  // Smooth scroll details panel into view on mobile only if off-screen
  nextTick(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024 && detailPanelRef.value) {
      const rect = detailPanelRef.value.getBoundingClientRect();
      const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (!isVisible) {
        detailPanelRef.value.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Keyboard Navigation Support
// ---------------------------------------------------------------------------
function handleKeydown(event: KeyboardEvent, day: number) {
  let targetDay = day;
  const maxDays = daysInCurrentMonth.value;

  switch (event.key) {
    case "ArrowLeft":
      event.preventDefault();
      targetDay = day > 1 ? day - 1 : day;
      break;
    case "ArrowRight":
      event.preventDefault();
      targetDay = day < maxDays ? day + 1 : day;
      break;
    case "ArrowUp":
      event.preventDefault();
      targetDay = day - 7 >= 1 ? day - 7 : day;
      break;
    case "ArrowDown":
      event.preventDefault();
      targetDay = day + 7 <= maxDays ? day + 7 : day;
      break;
    case "Home":
      event.preventDefault();
      targetDay = 1;
      break;
    case "End":
      event.preventDefault();
      targetDay = maxDays;
      break;
    case "Enter":
    case " ":
      event.preventDefault();
      selectDay(day);
      return;
    default:
      return;
  }

  if (targetDay !== day) {
    const btn = dayButtonRefs.value[targetDay - 1];
    if (btn) {
      btn.focus();
      selectDay(targetDay);
    }
  }
}

function formatAriaDate(day: number): string {
  const d = new Date(currentYear.value, currentMonth.value, day);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function retryFetch() {
  hasError.value = false;
  isLoading.value = true;
  setTimeout(() => {
    isLoading.value = false;
  }, 400);
}
</script>

<template>
  <section
    id="arthi-schedule"
    class="aarti-calendar-section"
    :class="{ 'kesari-variant': variant === 'kesari' }"
    aria-label="Temple Calendar and Aarti Schedule"
  >
    <div class="calendar-layout-container">
      <!-- Section Header -->
      <div class="section-top-bar">
        <div class="badge-row">
          <span class="section-badge">Calendar</span>
        </div>
        <h2 class="section-title">Temple Calendar & Event Schedule</h2>
        <p class="section-subtitle">
          Select any date to view the consecrated event timings, daily offering schedule, and upcoming sacred festivals.
        </p>
      </div>

      <!-- Main Two-Panel Grid (Mobile: Stacked, Desktop: 40% / 60%) -->
      <div class="panels-grid">
        <!-- ============================================================= -->
        <!-- LEFT PANEL: Mini Month Calendar (~40% on Desktop)             -->
        <!-- ============================================================= -->
        <div class="calendar-card" role="region" aria-label="Monthly Calendar View">
          <!-- Calendar Header: Month/Year + Navigation -->
          <div class="calendar-header">
            <div class="month-title-wrap">
              <svg class="calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <h3 class="month-label">{{ currentMonthLabel }}</h3>
            </div>

            <div class="month-controls">
              <button
                type="button"
                class="month-nav-btn"
                @click="prevMonth"
                aria-label="Previous Month"
                title="Previous Month"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>

              <button
                type="button"
                class="today-jump-btn"
                @click="goToToday"
                title="Jump to Today"
              >
                Today
              </button>

              <button
                type="button"
                class="month-nav-btn"
                @click="nextMonth"
                aria-label="Next Month"
                title="Next Month"
              >
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Weekday Column Headers (Sun ... Sat) -->
          <div class="weekday-grid" aria-hidden="true">
            <span
              v-for="dayName in weekdayNames"
              :key="dayName"
              class="weekday-cell"
            >
              {{ dayName }}
            </span>
          </div>

          <!-- Calendar Days Grid -->
          <div
            class="days-grid"
            role="grid"
            :aria-label="'Calendar for ' + currentMonthLabel"
          >
            <!-- Leading Blank Cells -->
            <div
              v-for="b in leadingBlanksCount"
              :key="'blank-' + b"
              class="blank-day-cell"
              aria-hidden="true"
            ></div>

            <!-- Active Month Days -->
            <button
              v-for="day in daysInCurrentMonth"
              :key="'day-' + day"
              :ref="(el) => (dayButtonRefs[day - 1] = el as HTMLButtonElement | null)"
              type="button"
              class="day-btn"
              :class="{
                'day-selected': isSelectedDate(day),
                'day-today': isTodayDate(day) && !isSelectedDate(day),
                'day-has-events': dayHasEvents(day),
              }"
              :aria-pressed="isSelectedDate(day)"
              :aria-current="isTodayDate(day) ? 'date' : undefined"
              :aria-label="formatAriaDate(day)"
              @click="selectDay(day)"
              @keydown="handleKeydown($event, day)"
            >
              <span class="day-number">{{ day }}</span>
              <!-- Special Event Dot Indicator -->
              <span
                v-if="dayHasEvents(day)"
                class="day-event-dot"
                aria-hidden="true"
              ></span>
            </button>
          </div>

        </div>

        <!-- ============================================================= -->
        <!-- RIGHT PANEL: Day Detail Panel (~60% on Desktop)              -->
        <!-- ============================================================= -->
        <div
          ref="detailPanelRef"
          class="detail-card"
          role="region"
          aria-live="polite"
          :aria-label="'Schedule for ' + formattedSelectedDate"
        >
          <!-- Panel Header -->
          <div class="detail-header">
            <div class="detail-title-group">
              <div class="panel-tag-row">
                <span v-if="isSelectedDateToday" class="today-badge">TODAY</span>
              </div>
              <h3 class="detail-heading">Event Schedule</h3>
              <p class="detail-date-str">
                <svg class="date-pin-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                </svg>
                <span>{{ formattedSelectedDate }}</span>
              </p>
            </div>

          </div>

          <!-- Loading State Placeholder -->
          <div v-if="isLoading" class="skeleton-grid" aria-busy="true">
            <div v-for="n in 4" :key="'skel-' + n" class="skeleton-card">
              <div class="skeleton-bar short"></div>
              <div class="skeleton-bar medium"></div>
              <div class="skeleton-bar full"></div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="hasError" class="error-box">
            <p>Unable to load the schedule for this day.</p>
            <button type="button" class="retry-btn" @click="retryFetch">
              Retry
            </button>
          </div>

          <!-- Content: Special Event + 4 Daily Aarti Cards -->
          <div v-else class="detail-body">
            <!-- Special Events Banner (if registered for this day) -->
            <div
              v-if="specialEventsForSelectedDate.length > 0"
              class="special-events-banner"
            >
              <div
                v-for="sp in specialEventsForSelectedDate"
                :key="sp.id"
                class="special-event-card"
              >
                <div class="sp-badge-row">
                  <span class="sp-tag">{{ sp.badge || 'Special Festival' }}</span>
                  <span class="sp-tithi">{{ sp.tithi }}</span>
                </div>
                <h4 class="sp-title">{{ sp.title }}</h4>
                <p class="sp-desc">{{ sp.description }}</p>
                <div v-if="sp.time" class="sp-time-row">
                  <svg class="time-clock-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                  </svg>
                  <span>{{ sp.time }}</span>
                </div>
              </div>
            </div>

            <!-- Empty Notice for Special Events -->
            <div v-else class="no-special-notice">
              <svg class="info-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <span>No special festival registered today • The regular Aarti and darshan schedule applies.</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* -------------------------------------------------------------------------
   SECTION CONTAINER (Responsive & Centered)
------------------------------------------------------------------------- */
.aarti-calendar-section {
  width: 100%;
  padding: 5rem 1.5rem;
  background-color: var(--bg-primary);
  position: relative;
}

@media (max-width: 640px) {
  .aarti-calendar-section {
    padding: 3.5rem 1rem;
  }
}

.calendar-layout-container {
  max-width: 1240px;
  margin: 0 auto;
  width: 100%;
}

/* -------------------------------------------------------------------------
   TOP BAR (Badges & Section Headings)
------------------------------------------------------------------------- */
.section-top-bar {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 3.25rem;
}

.badge-row {
  display: flex;
  justify-content: center;
  margin-bottom: 0.85rem;
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
}

.section-title {
  font-size: clamp(1.85rem, 3.5vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 0.85rem;
}

.section-subtitle {
  font-size: clamp(0.925rem, 1.3vw, 1.05rem);
  color: var(--text-secondary);
  line-height: 1.65;
  margin: 0;
}

/* -------------------------------------------------------------------------
   MAIN TWO-PANEL GRID (Mobile-First)
   - Mobile: 1 Column, full width
   - Tablet (md): 1 Column, centered
   - Desktop (lg): 2 Columns (40% / 60%)
------------------------------------------------------------------------- */
.panels-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  align-items: start;
  width: 100%;
}

@media (min-width: 1024px) {
  .panels-grid {
    grid-template-columns: 420px 1fr;
    gap: 2.25rem;
  }
}

@media (min-width: 1280px) {
  .panels-grid {
    grid-template-columns: 440px 1fr;
    gap: 2.75rem;
  }
}

/* -------------------------------------------------------------------------
   LEFT PANEL: CALENDAR CARD
------------------------------------------------------------------------- */
.calendar-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.75rem;
  width: 100%;
}

@media (max-width: 640px) {
  .calendar-card {
    padding: 1.15rem 0.65rem;
  }
}

@media (min-width: 640px) and (max-width: 1023px) {
  .calendar-card {
    max-width: 500px;
    margin: 0 auto;
  }
}

/* Calendar Header */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.25rem;
}

.month-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.calendar-icon {
  width: 20px;
  height: 20px;
  color: var(--accent);
  flex-shrink: 0;
}

.month-label {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.01em;
}

.month-controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.month-nav-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}

.month-nav-btn svg {
  width: 16px;
  height: 16px;
}

.month-nav-btn:hover {
  background-color: var(--nav-hover-bg);
  color: var(--text-primary);
  border-color: var(--accent);
}

.today-jump-btn {
  padding: 0.35rem 0.65rem;
  font-size: 0.775rem;
  font-weight: 700;
  color: var(--accent-text);
  background-color: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.today-jump-btn:hover {
  background-color: var(--accent);
  color: var(--btn-cta-text, #3F0A12);
}

/* Weekday Grid */
.weekday-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.35rem;
  margin-bottom: 0.6rem;
  text-align: center;
}

.weekday-cell {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.25rem 0;
}

/* Days Grid */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.35rem;
  width: 100%;
}

@media (max-width: 480px) {
  .days-grid {
    gap: 0.2rem;
  }
}

.blank-day-cell {
  min-height: 42px;
  min-width: 36px;
}

@media (max-width: 480px) {
  .blank-day-cell {
    min-height: 36px;
  }
}

/* Day Buttons */
.day-btn {
  min-height: 42px;
  min-width: 36px;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.925rem;
  font-weight: 600;
  position: relative;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  padding: 0.25rem;
}

@media (max-width: 480px) {
  .day-btn {
    min-height: 36px;
    font-size: 0.825rem;
    padding: 0.15rem;
  }
}

.day-btn:hover {
  background-color: var(--nav-hover-bg);
  border-color: var(--border-color);
}

.day-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Today (when not selected) */
.day-btn.day-today {
  border: 1.5px solid var(--accent);
  color: var(--accent-text);
  font-weight: 700;
}

/* SELECTED DAY: Dark Maroon Pill, Gold Text in Palette A / Hibiscus in Palette B */
.day-btn.day-selected {
  background-color: var(--cal-selected-bg, #3F0A12) !important;
  color: var(--cal-selected-text, #E0A526) !important;
  font-weight: 800;
  border-radius: 9999px; /* Pill */
  border-color: var(--cal-selected-bg, #3F0A12) !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
}

/* Event Dot Indicator */
.day-event-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--accent);
  margin-top: 2px;
  flex-shrink: 0;
}

.day-btn.day-selected .day-event-dot {
  background-color: var(--gold, #E0A526);
}

/* Calendar Legend */
.calendar-legend {
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 0.85rem;
  padding-top: 1.25rem;
  margin-top: 1.25rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.775rem;
  color: var(--text-muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  display: inline-block;
}

.swatch-selected {
  background-color: var(--cal-selected-bg, #3F0A12);
  border: 1px solid var(--accent);
}

.swatch-today {
  background-color: transparent;
  border: 1.5px solid var(--accent);
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--accent);
  display: inline-block;
}

/* -------------------------------------------------------------------------
   RIGHT PANEL: DAY DETAIL CARD
------------------------------------------------------------------------- */
.detail-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
}

@media (max-width: 640px) {
  .detail-card {
    padding: 1.35rem 1rem;
  }
}

/* Detail Header */
.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
}

.detail-title-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.panel-tag-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.panel-kicker {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--accent-text);
  text-transform: uppercase;
}

.today-badge {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.15rem 0.55rem;
  background-color: var(--cal-selected-bg, #3F0A12);
  color: var(--cal-selected-text, #E0A526);
  border-radius: 9999px;
  border: 1px solid var(--accent);
  letter-spacing: 0.06em;
}

.detail-heading {
  font-size: clamp(1.4rem, 2.4vw, 1.85rem);
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.detail-date-str {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.925rem;
  color: var(--text-secondary);
  margin: 0.15rem 0 0;
}

.date-pin-icon {
  width: 16px;
  height: 16px;
  color: var(--accent);
  flex-shrink: 0;
}

.public-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.85rem;
  background-color: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  font-size: 0.775rem;
  font-weight: 600;
  color: var(--text-secondary);
  align-self: flex-start;
}

.status-circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #22c55e; /* Solid green */
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
}

/* Special Events Banner */
.special-events-banner {
  margin-bottom: 1.75rem;
}

.special-event-card {
  background-color: var(--action-btn-bg);
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
}

.sp-badge-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.sp-tag {
  font-size: 0.725rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--btn-cta-text, #3F0A12);
  background-color: var(--accent);
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  letter-spacing: 0.05em;
}

.sp-tithi {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-text);
}

.sp-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.35rem;
}

.sp-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.55;
  margin: 0 0 0.65rem;
}

.sp-time-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.825rem;
  font-weight: 700;
  color: var(--accent-text);
}

.time-clock-icon {
  width: 15px;
  height: 15px;
}

/* Empty Notice */
.no-special-notice {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1.15rem;
  background-color: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 1.75rem;
}

.info-icon {
  width: 18px;
  height: 18px;
  color: var(--accent);
  flex-shrink: 0;
}

/* Aarti Cards Grid (Mobile: 1 col, Tablet/Desktop: 2 cols) */
.aarti-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.15rem;
}

@media (min-width: 640px) {
  .aarti-cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
}

/* Aarti Card */
.aarti-card {
  background-color: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.35rem 1.25rem;
  transition: transform 0.18s ease, border-color 0.18s ease;
  display: flex;
  flex-direction: column;
}

.aarti-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
}

.aarti-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.time-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.75rem;
  background-color: var(--brand-deep, #3F0A12);
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  font-size: 0.775rem;
  font-weight: 700;
  color: var(--color-on-brand, #F7EFE0);
}

.mini-clock {
  width: 13px;
  height: 13px;
}

.aarti-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}

.ritual-svg {
  width: 18px;
  height: 18px;
}

.aarti-card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.35rem;
  letter-spacing: -0.01em;
}

.aarti-card-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  flex: 1;
}

/* Loading Skeleton */
.skeleton-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.skeleton-card {
  background-color: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-bar {
  height: 14px;
  background-color: var(--border-color);
  border-radius: 4px;
}

.skeleton-bar.short {
  width: 40%;
}

.skeleton-bar.medium {
  width: 70%;
}

.skeleton-bar.full {
  width: 100%;
}

/* Error State */
.error-box {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--text-muted);
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1.25rem;
  background-color: var(--accent);
  color: var(--btn-cta-text, #3F0A12);
  border: none;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .day-btn,
  .aarti-card,
  .month-nav-btn {
    transition: none !important;
  }
}

/* -------------------------------------------------------------------------
   KESARI SAFFRON VARIANT (for Alternative / Home-2 Layout)
------------------------------------------------------------------------- */
.aarti-calendar-section.kesari-variant .section-badge {
  color: var(--kesari, #ea580c);
  border-color: rgba(234, 88, 12, 0.3);
}

.aarti-calendar-section.kesari-variant .calendar-icon,
.aarti-calendar-section.kesari-variant .date-pin-icon,
.aarti-calendar-section.kesari-variant .info-icon,
.aarti-calendar-section.kesari-variant .time-clock-icon {
  color: var(--kesari, #ea580c);
}

.aarti-calendar-section.kesari-variant .day-btn.day-selected {
  background-color: #7c2d12 !important; /* Deep Terracotta Maroon */
  color: #ffedd5 !important;
  border-color: #9a3412 !important;
  box-shadow: 0 4px 12px rgba(124, 45, 18, 0.45);
}

.aarti-calendar-section.kesari-variant .day-btn.day-today {
  border-color: var(--kesari, #ea580c);
  color: var(--kesari, #ea580c);
}

.aarti-calendar-section.kesari-variant .day-event-dot,
.aarti-calendar-section.kesari-variant .legend-dot {
  background-color: var(--kesari, #ea580c);
}

.aarti-calendar-section.kesari-variant .swatch-selected {
  background-color: #7c2d12;
  border-color: var(--kesari, #ea580c);
}

.aarti-calendar-section.kesari-variant .swatch-today {
  border-color: var(--kesari, #ea580c);
}

.aarti-calendar-section.kesari-variant .today-jump-btn {
  color: var(--kesari, #ea580c);
}

.aarti-calendar-section.kesari-variant .today-jump-btn:hover {
  background-color: var(--kesari, #ea580c);
  color: #ffffff;
}

.aarti-calendar-section.kesari-variant .panel-kicker,
.aarti-calendar-section.kesari-variant .time-badge,
.aarti-calendar-section.kesari-variant .aarti-icon-box {
  color: var(--kesari, #ea580c);
}

.aarti-calendar-section.kesari-variant .aarti-card:hover {
  border-color: var(--kesari, #ea580c);
}

.aarti-calendar-section.kesari-variant .special-event-card {
  border-color: var(--kesari, #ea580c);
}

.aarti-calendar-section.kesari-variant .sp-tag {
  background-color: var(--kesari, #ea580c);
  color: #ffffff;
}

.aarti-calendar-section.kesari-variant .sp-tithi,
.aarti-calendar-section.kesari-variant .sp-time-row {
  color: var(--kesari-light, #fb923c);
}
</style>
