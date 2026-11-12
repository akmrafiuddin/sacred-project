<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute } from "vue-router";

interface PujaOption {
  id: number;
  slug: string;
  name: string;
  priceBdt: number;
  duration?: string;
}

const route = useRoute();

// Fallback canonical pujas
const defaultPujas: PujaOption[] = [
  { id: 1, slug: "nitya-puja", name: "Nitya Puja", priceBdt: 501, duration: "45 minutes" },
  { id: 2, slug: "satyanarayan-puja", name: "Satyanarayan Puja", priceBdt: 1501, duration: "2 hours" },
  { id: 3, slug: "rudrabhishek", name: "Rudrabhishek", priceBdt: 2001, duration: "1 hour 30 mins" },
  { id: 4, slug: "kali-puja", name: "Kali Puja (Individual)", priceBdt: 2501, duration: "1 hour" },
];

// Fetch available pujas from public endpoint
const { data: serverPujas } = await useFetch<{ items: any[] }>("/api/public/pujas", {
  key: "booking_pujas_options",
  server: true,
});

const pujaOptions = computed<PujaOption[]>(() => {
  const items = serverPujas.value?.items;
  if (Array.isArray(items) && items.length > 0) {
    return items
      .filter((p) => p.active !== false && p.bookable !== false)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: typeof p.name === "object" ? p.name?.en || p.name?.bn || "Puja" : p.name,
        priceBdt: Number(p.priceBdt || p.price_bdt || 0),
        duration: p.duration || "",
      }));
  }
  return defaultPujas;
});

// Form state
const selectedPujaId = ref<number | null>(null);

const form = reactive({
  name: "",
  phone: "",
  email: "",
  gotra: "",
  preferredDate: "",
  note: "",
  honeypot: "",
  turnstileToken: "mock-token",
});

// Pre-select puja from route query if available
onMounted(() => {
  const querySlug = route.query.puja as string;
  const queryId = Number(route.query.id);

  if (queryId && pujaOptions.value.some((p) => p.id === queryId)) {
    selectedPujaId.value = queryId;
  } else if (querySlug) {
    const match = pujaOptions.value.find((p) => p.slug === querySlug);
    if (match) selectedPujaId.value = match.id;
  }

  if (!selectedPujaId.value && pujaOptions.value.length > 0) {
    selectedPujaId.value = pujaOptions.value[0]?.id ?? null;
  }
});

// Selected puja details helper
const selectedPujaDetails = computed(() => {
  return pujaOptions.value.find((p) => p.id === selectedPujaId.value);
});

// Today's date for date-picker min attribute
const todayDateStr = new Date().toISOString().slice(0, 10);

// Submission handling
const isSubmitting = ref(false);
const errorMessage = ref("");
const fieldErrors = ref<Record<string, string[]>>({});

const validateForm = (): boolean => {
  fieldErrors.value = {};
  errorMessage.value = "";
  let valid = true;

  if (!form.name.trim() || form.name.trim().length < 2) {
    fieldErrors.value.name = ["Name must be at least 2 characters"];
    valid = false;
  }

  // BD phone validation
  const phoneClean = form.phone.trim();
  const bdPhoneRegex = /^(?:\+?880|0)?1[3-9]\d{8}$/;
  if (!phoneClean) {
    fieldErrors.value.phone = ["Mobile number is required"];
    valid = false;
  } else if (!bdPhoneRegex.test(phoneClean)) {
    fieldErrors.value.phone = ["Enter a valid Bangladesh phone number (e.g. 01819123456)"];
    valid = false;
  }

  if (!form.preferredDate) {
    fieldErrors.value.preferredDate = ["Please select your preferred date for worship"];
    valid = false;
  }

  return valid;
};

const handleBookingSubmit = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    const payload = {
      pujaId: selectedPujaId.value || undefined,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      gotra: form.gotra.trim() || undefined,
      preferredDate: form.preferredDate,
      note: form.note.trim() || undefined,
      honeypot: form.honeypot,
      turnstileToken: form.turnstileToken || "mock-token",
    };

    const res = await $fetch<{ success: boolean; ref: string; message: string }>("/api/forms/booking", {
      method: "POST",
      body: payload,
    });

    if (res?.success && res.ref) {
      // Forward to booking status page with reference
      await navigateTo({
        path: "/booking-status",
        query: { ref: res.ref, new: "1" },
      });
    } else {
      errorMessage.value = "Unable to complete booking. Please try again or contact the office.";
    }
  } catch (err: any) {
    console.error("Booking error:", err);
    if (err?.data?.data && typeof err.data.data === "object") {
      fieldErrors.value = err.data.data;
    }
    errorMessage.value = err?.data?.message || err?.message || "Failed to submit booking request.";
  } finally {
    isSubmitting.value = false;
  }
};

useHead({
  title: "Puja Booking Request - Golpahar Mohashoshan Kali Mandir",
  meta: [
    {
      name: "description",
      content:
        "Book a sacred Vedic puja, Nitya puja, Satyanarayan katha, or Rudrabhishek at Golpahar Mohashoshan Kali Mandir in Chittagong. Submit devotee sankalpa and name.",
    },
    { property: "og:title", content: "Puja Booking Request - Golpahar Kali Mandir" },
  ],
});
</script>

<template>
  <div class="booking-page" lang="en">
    <!-- HERO HEADER -->
    <header class="page-hero">
      <div class="hero-inner">
        <span class="hero-badge">Sacred Devotional Sankalpa</span>
        <h1 class="hero-title">Puja Booking Request</h1>
        <p class="hero-subtitle">
          Submit your sacred puja request with your name and gotra.
          The temple administration and priests will review your preferred date and confirm the arrangements.
        </p>
        <div class="hero-divider" aria-hidden="true"></div>
      </div>
    </header>

    <main class="page-container">
      <div class="booking-card">
        <!-- Error notification banner -->
        <div v-if="errorMessage" class="error-banner" role="alert">
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleBookingSubmit" class="booking-form" novalidate>
          <!-- 1. PUJA OFFERING SELECTOR -->
          <div class="form-group">
            <label class="form-label" for="puja-select">
              Select Puja Offering <span class="required-star">*</span>
            </label>
            <select
              id="puja-select"
              v-model.number="selectedPujaId"
              class="form-select"
            >
              <option
                v-for="p in pujaOptions"
                :key="p.id"
                :value="p.id"
              >
                {{ p.name }} — ৳{{ p.priceBdt.toLocaleString() }} {{ p.duration ? `(${p.duration})` : '' }}
              </option>
            </select>
          </div>

          <!-- Highlight of selected puja -->
          <div v-if="selectedPujaDetails" class="selected-puja-pill">
            <div class="pill-info">
              <span class="pill-title">{{ selectedPujaDetails.name }}</span>
              <span v-if="selectedPujaDetails.duration" class="pill-duration">
                Estimated Duration: {{ selectedPujaDetails.duration }}
              </span>
            </div>
            <div class="pill-dakshina">
              <span class="dakshina-label">Dakshina</span>
              <span class="dakshina-val">৳{{ selectedPujaDetails.priceBdt.toLocaleString() }}</span>
            </div>
          </div>

          <!-- 2. DEVOTEE NAME & PHONE -->
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="devotee-name">
                Devotee Full Name <span class="required-star">*</span>
              </label>
              <input
                id="devotee-name"
                v-model="form.name"
                type="text"
                class="form-input"
                :class="{ 'input-error': fieldErrors.name }"
                placeholder="e.g. Animesh Das"
                autocomplete="name"
                required
              />
              <span v-if="fieldErrors.name" class="field-error-text">
                {{ fieldErrors.name[0] }}
              </span>
            </div>

            <div class="form-group">
              <label class="form-label" for="devotee-phone">
                Mobile Number (Bangladesh) <span class="required-star">*</span>
              </label>
              <input
                id="devotee-phone"
                v-model="form.phone"
                type="tel"
                class="form-input"
                :class="{ 'input-error': fieldErrors.phone }"
                placeholder="e.g. 01819123456"
                autocomplete="tel"
                required
              />
              <span v-if="fieldErrors.phone" class="field-error-text">
                {{ fieldErrors.phone[0] }}
              </span>
            </div>
          </div>

          <!-- 3. EMAIL & GOTRA -->
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="devotee-email">
                Email Address <span class="optional-tag">(Optional)</span>
              </label>
              <input
                id="devotee-email"
                v-model="form.email"
                type="email"
                class="form-input"
                :class="{ 'input-error': fieldErrors.email }"
                placeholder="e.g. devotee@example.com"
                autocomplete="email"
              />
              <span v-if="fieldErrors.email" class="field-error-text">
                {{ fieldErrors.email[0] }}
              </span>
            </div>

            <div class="form-group">
              <label class="form-label" for="devotee-gotra">
                Devotee Gotra <span class="optional-tag">(For Sankalpa)</span>
              </label>
              <input
                id="devotee-gotra"
                v-model="form.gotra"
                type="text"
                class="form-input"
                placeholder="e.g. Kashyapa, Shandilya, Bharadwaja"
              />
            </div>
          </div>

          <!-- 4. PREFERRED DATE -->
          <div class="form-group">
            <label class="form-label" for="preferred-date">
              Preferred Puja Date <span class="required-star">*</span>
            </label>
            <input
              id="preferred-date"
              v-model="form.preferredDate"
              type="date"
              class="form-input"
              :class="{ 'input-error': fieldErrors.preferredDate }"
              :min="todayDateStr"
              required
            />
            <span v-if="fieldErrors.preferredDate" class="field-error-text">
              {{ fieldErrors.preferredDate[0] }}
            </span>
            <span class="hint-text">The date you wish the sacred puja to be performed at the mandir.</span>
          </div>

          <!-- 5. DEVOTEE PRAYER / NOTE -->
          <div class="form-group">
            <label class="form-label" for="devotee-note">
              Sankalpa Intention / Prayer Note <span class="optional-tag">(Optional)</span>
            </label>
            <textarea
              id="devotee-note"
              v-model="form.note"
              rows="3"
              class="form-textarea"
              placeholder="e.g. Birthday blessing, peace and health for family, remembrance..."
            ></textarea>
          </div>

          <!-- Honeypot (bot prevention) -->
          <div style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;" aria-hidden="true">
            <input v-model="form.honeypot" type="text" tabindex="-1" autocomplete="off" />
          </div>

          <!-- SUBMISSION BUTTON -->
          <div class="form-actions">
            <button
              type="submit"
              class="btn-submit-booking"
              :disabled="isSubmitting"
            >
              <span>{{ isSubmitting ? 'Submitting Request...' : 'Submit Puja Booking Request' }}</span>
            </button>
            <NuxtLink to="/booking-status" class="btn-check-existing">
              Already have a reference code? Check Status &rarr;
            </NuxtLink>
          </div>
        </form>
      </div>

      <!-- BOTTOM ASSISTANCE CARD -->
      <section class="booking-help-card" aria-label="Devotee Help">
        <h2 class="help-title">Need Immediate Guidance?</h2>
        <p class="help-text">
          If you have special requirements, ancestral shraddha rituals, or wish to perform a puja today,
          please contact the Temple Devotee Desk directly.
        </p>
        <NuxtLink to="/contact" class="btn-contact-desk">
          Connect with Devotee Desk
        </NuxtLink>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ----------------------------------------------------
   PUJA BOOKING PAGE STYLING
   Minimal, serene, accessible, and clean.
   ---------------------------------------------------- */
.booking-page {
  width: 100%;
  min-height: 85vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding-top: calc(var(--nav-height, 72px) + 2rem);
  padding-bottom: 5rem;
}

.page-hero {
  padding: 2.5rem 1.5rem 2rem;
  text-align: center;
}

.hero-inner {
  max-width: 720px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-block;
  padding: 0.35rem 0.9rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent-text);
  background-color: rgba(110, 5, 22, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  margin-bottom: 1.25rem;
}

html[data-theme="dark"] .hero-badge,
html.dark .hero-badge {
  background-color: rgba(230, 179, 74, 0.08);
}

.hero-title {
  font-family: var(--font-serif);
  font-size: clamp(2.2rem, 4.2vw, 3.4rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.015em;
  color: var(--heading-color);
  margin: 0 0 1rem;
}

.hero-subtitle {
  font-size: clamp(1rem, 1.8vw, 1.125rem);
  line-height: 1.65;
  color: var(--text-secondary);
  margin: 0 auto;
  max-width: 620px;
}

.hero-divider {
  width: 56px;
  height: 2px;
  background: var(--accent);
  margin: 2rem auto 0;
  opacity: 0.75;
}

.page-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 0;
}

.booking-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 18px;
  padding: 2.5rem 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.03);
  margin-bottom: 3.5rem;
}

@media (max-width: 640px) {
  .booking-card {
    padding: 1.75rem 1.25rem;
  }
}

.error-banner {
  background-color: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 8px;
  padding: 0.85rem 1rem;
  color: #b91c1c;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1.75rem;
}

.booking-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 640px) {
  .form-grid-2 {
    grid-template-columns: 1fr 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
}

.required-star {
  color: #dc2626;
}

.optional-tag {
  font-size: 0.775rem;
  font-weight: 500;
  color: var(--text-muted);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem 0.95rem;
  font-size: 0.925rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(224, 165, 38, 0.15);
}

.input-error {
  border-color: #dc2626 !important;
}

.field-error-text {
  font-size: 0.775rem;
  color: #dc2626;
  font-weight: 600;
}

.hint-text {
  font-size: 0.775rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.selected-puja-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 0.9rem 1.15rem;
}

.pill-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.pill-title {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.pill-duration {
  font-size: 0.775rem;
  color: var(--text-muted);
}

.pill-dakshina {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.dakshina-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.dakshina-val {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-text);
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
  align-items: center;
}

.btn-submit-booking {
  width: 100%;
  padding: 0.9rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--btn-primary-text);
  background-color: var(--btn-primary-bg);
  border: 1px solid var(--btn-primary-bg);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-submit-booking:hover:not(:disabled) {
  background-color: var(--btn-primary-hover);
  border-color: var(--btn-primary-hover);
}

.btn-submit-booking:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-check-existing {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-text);
  text-decoration: none;
}

.btn-check-existing:hover {
  text-decoration: underline;
}

/* ====================================================
   BOTTOM ASSISTANCE CARD
   ==================================================== */
.booking-help-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 2rem;
  text-align: center;
}

.help-title {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.help-text {
  font-size: 0.925rem;
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 540px;
  margin: 0 auto 1.25rem;
}

.btn-contact-desk {
  display: inline-block;
  padding: 0.65rem 1.25rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-contact-desk:hover {
  background-color: var(--nav-hover-bg);
  border-color: var(--accent);
}
</style>
