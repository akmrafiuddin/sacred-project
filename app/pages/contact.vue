<script setup lang="ts">
import { ref, reactive, computed } from "vue";

useHead({
  title: "Contact Us & Devotee Desk",
  meta: [
    {
      name: "description",
      content:
        "Official contact information, darshan hours, devotee helpline, and inquiry desk for Golpahar Mohashoshan Kali Mandir, Chittagong, Bangladesh.",
    },
    { property: "og:title", content: "Contact Mandir Office - Golpahar Mohashoshan Kali Mandir" },
    {
      property: "og:description",
      content:
        "Connect with temple administration for daily darshan timings, puja bookings, annadanam sponsorship, and pilgrim assistance.",
    },
  ],
});

// Category options for the inquiry subject
const subjectCategories = [
  { label: "Daily Darshan & Temple Visit", value: "Daily Darshan & Temple Visit" },
  { label: "Puja & Sankalpa Service", value: "Puja & Sankalpa Service" },
  { label: "Annadanam & Mahaprasad Seva", value: "Annadanam & Mahaprasad Seva" },
  { label: "Antim Sanskar / Shoshan Guidelines", value: "Antim Sanskar / Shoshan Guidelines" },
  { label: "Donation & Trust Inquiries", value: "Donation & Trust Inquiries" },
  { label: "General Devotee Message", value: "General Devotee Message" },
  { label: "Other / Custom Topic", value: "custom" },
];

const defaultCategory = subjectCategories[0]?.value ?? "Daily Darshan & Temple Visit";
const selectedCategory = ref(defaultCategory);
const isCustomSubject = computed(() => selectedCategory.value === "custom");

const form = reactive({
  name: "",
  phone: "",
  email: "",
  customSubject: "",
  message: "",
  honeypot: "",
  turnstileToken: "mock-token",
});

const isSubmitting = ref(false);
const isSuccess = ref(false);
const successMessage = ref("");
const submissionRefId = ref<number | null>(null);
const errorMessage = ref("");
const fieldErrors = ref<Record<string, string[]>>({});

// Dynamic character count for message
const charCount = computed(() => form.message.length);
const minChars = 5;
const maxChars = 2000;
const isMessageValid = computed(() => charCount.value >= minChars && charCount.value <= maxChars);

// Client-side validation
const validateForm = (): boolean => {
  fieldErrors.value = {};
  let valid = true;

  if (!form.name || form.name.trim().length < 2) {
    fieldErrors.value.name = ["Name must be at least 2 characters"];
    valid = false;
  }

  const effectiveSubject = isCustomSubject.value
    ? form.customSubject.trim()
    : selectedCategory.value;

  if (!effectiveSubject || effectiveSubject.length < 2) {
    fieldErrors.value.subject = ["Subject must be at least 2 characters"];
    valid = false;
  }

  if (form.email && form.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      fieldErrors.value.email = ["Please enter a valid email address"];
      valid = false;
    }
  }

  if (!form.message || form.message.trim().length < minChars) {
    fieldErrors.value.message = [`Message must be at least ${minChars} characters`];
    valid = false;
  } else if (form.message.length > maxChars) {
    fieldErrors.value.message = [`Message cannot exceed ${maxChars} characters`];
    valid = false;
  }

  return valid;
};

// Handle form submission
const handleSubmit = async () => {
  errorMessage.value = "";
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    const effectiveSubject = isCustomSubject.value
      ? form.customSubject.trim()
      : selectedCategory.value;

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      subject: effectiveSubject,
      message: form.message.trim(),
      honeypot: form.honeypot,
      turnstileToken: form.turnstileToken || "mock-token",
    };

    const response = await $fetch<{ success: boolean; message: string; id?: number }>(
      "/api/forms/contact",
      {
        method: "POST",
        body: payload,
      }
    );

    if (response.success) {
      isSuccess.value = true;
      successMessage.value =
        response.message || "Thank you. Your message has been received by the temple office.";
      submissionRefId.value = response.id || null;
      // Reset form fields
      form.name = "";
      form.phone = "";
      form.email = "";
      form.customSubject = "";
      form.message = "";
      selectedCategory.value = defaultCategory;
    }
  } catch (err: any) {
    if (err?.data?.data) {
      fieldErrors.value = err.data.data;
    }
    errorMessage.value =
      err?.data?.message ||
      err?.statusMessage ||
      "Unable to send message. Please review the highlighted fields and try again.";
  } finally {
    isSubmitting.value = false;
  }
};

const handleReset = () => {
  isSuccess.value = false;
  successMessage.value = "";
  submissionRefId.value = null;
  errorMessage.value = "";
  fieldErrors.value = {};
};
</script>

<template>
  <div class="contact-page">
    <!-- Breadcrumb Bar -->
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <div class="contact-container">
        <ol class="breadcrumb-list">
          <li class="breadcrumb-item">
            <NuxtLink to="/" class="breadcrumb-link">Home</NuxtLink>
          </li>
          <li class="breadcrumb-separator" aria-hidden="true">/</li>
          <li class="breadcrumb-item active" aria-current="page">Contact Us</li>
        </ol>
      </div>
    </nav>

    <!-- Hero Header -->
    <header class="contact-hero">
      <div class="contact-container hero-inner">
        <div class="hero-badge">
          <span class="badge-dot" aria-hidden="true"></span>
          <span>Pilgrim Helpline &amp; Office Desk</span>
        </div>

        <h1 class="hero-title">
          <span class="english-title">Contact Mandir Office</span>
        </h1>

        <p class="hero-subtitle">
          Welcome to Golpahar Mohashoshan Kali Mandir. Whether you are planning a pilgrim visit,
          arranging a special puja offering, or seeking temple trust guidance, our office desk is here to assist.
        </p>

        <div class="hero-quick-status">
          <div class="status-item">
            <span class="status-indicator"></span>
            <span>Sanctum Open Daily</span>
          </div>
          <div class="status-divider" aria-hidden="true">·</div>
          <div class="status-item">
            <span>Morning 05:00 AM – 12:30 PM</span>
          </div>
          <div class="status-divider" aria-hidden="true">·</div>
          <div class="status-item">
            <span>Evening 04:30 PM – 09:30 PM</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Layout -->
    <section class="contact-content-section" aria-label="Temple Information and Contact Form">
      <div class="contact-container">
        <div class="contact-grid">
          <!-- LEFT COLUMN: Mandir Info, Timings, Direct Contacts -->
          <div class="info-column">
            <!-- 1. Location & How to Reach Card -->
            <div class="info-card location-card">
              <div class="card-header">
                <div class="card-icon-wrap" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 21s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <h2 class="card-title">Temple Location</h2>
                </div>
              </div>

              <div class="card-body">
                <div class="address-box">
                  <strong class="temple-formal-name">Sri Sri Golpahar Mohashoshan Kali Mandir</strong>
                  <p class="address-text">
                    Golpahar Moor, O.R. Nizam Road / Mehedibag Road,<br />
                    Chittagong-4000, Bangladesh.
                  </p>
                  <p class="landmark-text">
                    <em>Landmark:</em> Situated opposite Chittagong Medical College East Gate area, near Prabartak Circle.
                  </p>
                </div>

                <div class="directions-actions">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Golpahar+Mohashoshan+Kali+Mandir+Chittagong"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-directions"
                  >
                    <span>Open in Google Maps</span>
                    <svg viewBox="0 0 20 20" fill="currentColor" class="action-icon" aria-hidden="true">
                      <path
                        d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"
                      />
                      <path
                        d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <!-- 2. Darshan & Office Hours Card -->
            <div class="info-card timings-card">
              <div class="card-header">
                <div class="card-icon-wrap" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h2 class="card-title">Darshan &amp; Office Hours</h2>
                </div>
              </div>

              <div class="card-body">
                <ul class="timings-list">
                  <li class="timing-row">
                    <div class="timing-meta">
                      <span class="timing-name">Morning Darshan &amp; Puja</span>
                      <span class="timing-desc">Mangal Aarti, Nitya Puja &amp; Bhog</span>
                    </div>
                    <span class="timing-value">05:00 AM – 12:30 PM</span>
                  </li>

                  <li class="timing-row">
                    <div class="timing-meta">
                      <span class="timing-name">Sanctum Mid-Day Rest</span>
                      <span class="timing-desc">Temple sanctum closed during afternoon</span>
                    </div>
                    <span class="timing-value closed">12:30 PM – 04:30 PM</span>
                  </li>

                  <li class="timing-row">
                    <div class="timing-meta">
                      <span class="timing-name">Evening Darshan &amp; Aarti</span>
                      <span class="timing-desc">Sandhya Aarti, Bhajan &amp; Shayan Aarti</span>
                    </div>
                    <span class="timing-value">04:30 PM – 09:30 PM</span>
                  </li>

                  <li class="timing-row highlight-row">
                    <div class="timing-meta">
                      <span class="timing-name">Administrative &amp; Trust Desk</span>
                      <span class="timing-desc">Open 7 days a week for devotees</span>
                    </div>
                    <span class="timing-value">09:00 AM – 06:00 PM</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- 3. Direct Contact Channels Card -->
            <div class="info-card contacts-card">
              <div class="card-header">
                <div class="card-icon-wrap" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 class="card-title">Helpline &amp; Direct Channels</h2>
                </div>
              </div>

              <div class="card-body">
                <div class="channels-list">
                  <!-- Landline Devotee Desk -->
                  <div class="channel-item">
                    <div class="channel-info">
                      <span class="channel-label">Temple Devotee Desk</span>
                      <a href="tel:+880241356335" class="channel-link">+880 2-41356335</a>
                    </div>
                    <a href="tel:+880241356335" class="channel-action-btn" title="Call devotee desk">
                      Call
                    </a>
                  </div>

                  <!-- WhatsApp Helpline -->
                  <div class="channel-item">
                    <div class="channel-info">
                      <span class="channel-label">Devotee WhatsApp Assistance</span>
                      <a
                        href="https://wa.me/8801819123456"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="channel-link"
                      >
                        +880 1819-123456
                      </a>
                    </div>
                    <a
                      href="https://wa.me/8801819123456"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="channel-action-btn whatsapp-btn"
                      title="Open WhatsApp chat"
                    >
                      WhatsApp
                    </a>
                  </div>

                  <!-- Email -->
                  <div class="channel-item">
                    <div class="channel-info">
                      <span class="channel-label">Official Inquiries &amp; Trust Email</span>
                      <a href="mailto:office@golpaharkalimandir.org" class="channel-link">
                        office@golpaharkalimandir.org
                      </a>
                    </div>
                    <a
                      href="mailto:office@golpaharkalimandir.org"
                      class="channel-action-btn"
                      title="Send email"
                    >
                      Email
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Sacred Guidelines / Antim Sanskar Notice -->
            <div class="notice-card" role="note">
              <div class="notice-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="notice-text">
                <h3 class="notice-title">Antim Sanskar / Cremation Assistance</h3>
                <p class="notice-desc">
                  For urgent traditional Hindu cremation rites or emergency Mohashoshan guidance,
                  please contact the on-duty priest desk directly by telephone at any hour.
                </p>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Sacred Devotee Inquiry Form -->
          <div class="form-column">
            <div class="inquiry-form-card">
              <!-- Success State Confirmation View -->
              <div v-if="isSuccess" class="form-success-state" role="status" aria-live="polite">
                <div class="success-icon-wrap" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>

                <h2 class="success-title">Message Received</h2>

                <p class="success-message">
                  {{ successMessage }}
                </p>

                <div v-if="submissionRefId" class="reference-box">
                  <span class="ref-label">Inquiry Reference Number</span>
                  <span class="ref-value">#GKM-{{ submissionRefId.toString().padStart(5, '0') }}</span>
                </div>

                <p class="success-note">
                  The Golpahar Kali Mandir Seva Desk will review your message and reach out promptly.
                  Blessings of Mother Kali be upon you and your family.
                </p>

                <button type="button" class="btn btn-reset" @click="handleReset">
                  <span>Send Another Message</span>
                </button>
              </div>

              <!-- Main Submission Form View -->
              <div v-else>
                <div class="form-header">
                  <h2 class="form-title">Send an Inquiry</h2>
                  <p class="form-description">
                    Fill out the form below. Whether inquiring about Sankalpa puja, daily bhog,
                    or general information, our devotee desk will respond within 24–48 hours.
                  </p>
                </div>

                <!-- Error Alert Box -->
                <div
                  v-if="errorMessage"
                  class="alert-error"
                  role="alert"
                  aria-live="assertive"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div class="alert-content">
                    <span class="alert-heading">Notice</span>
                    <p class="alert-text">{{ errorMessage }}</p>
                  </div>
                </div>

                <form class="contact-form" novalidate @submit.prevent="handleSubmit">
                  <!-- Honeypot Anti-Spam Field (Hidden from humans) -->
                  <div class="hp-field" aria-hidden="true">
                    <label for="contact-hp">Leave this empty if human</label>
                    <input
                      id="contact-hp"
                      v-model="form.honeypot"
                      type="text"
                      name="website_verify"
                      autocomplete="off"
                      tabindex="-1"
                    />
                  </div>

                  <!-- 1. Full Name -->
                  <div class="form-group" :class="{ 'has-error': fieldErrors.name }">
                    <label for="contact-name" class="form-label">
                      <span>Full Name</span>
                      <span class="required-mark" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="contact-name"
                      v-model="form.name"
                      type="text"
                      class="form-input"
                      placeholder="e.g., Anirban Roy"
                      required
                      maxlength="100"
                      :disabled="isSubmitting"
                    />
                    <p v-if="fieldErrors.name" class="field-error-text">
                      {{ fieldErrors.name[0] }}
                    </p>
                  </div>

                  <!-- 2. Two-Column Row: Phone & Email -->
                  <div class="form-row-2">
                    <!-- Contact Phone -->
                    <div class="form-group" :class="{ 'has-error': fieldErrors.phone }">
                      <label for="contact-phone" class="form-label">
                        <span>Mobile Phone</span>
                        <span class="optional-mark">(Optional)</span>
                      </label>
                      <input
                        id="contact-phone"
                        v-model="form.phone"
                        type="tel"
                        class="form-input"
                        placeholder="e.g., 01819123456"
                        maxlength="20"
                        :disabled="isSubmitting"
                      />
                      <p v-if="fieldErrors.phone" class="field-error-text">
                        {{ fieldErrors.phone[0] }}
                      </p>
                    </div>

                    <!-- Email Address -->
                    <div class="form-group" :class="{ 'has-error': fieldErrors.email }">
                      <label for="contact-email" class="form-label">
                        <span>Email Address</span>
                        <span class="optional-mark">(Optional)</span>
                      </label>
                      <input
                        id="contact-email"
                        v-model="form.email"
                        type="email"
                        class="form-input"
                        placeholder="e.g., devotee@example.com"
                        :disabled="isSubmitting"
                      />
                      <p v-if="fieldErrors.email" class="field-error-text">
                        {{ fieldErrors.email[0] }}
                      </p>
                    </div>
                  </div>

                  <!-- 3. Subject / Category Selection -->
                  <div class="form-group" :class="{ 'has-error': fieldErrors.subject }">
                    <label for="contact-category" class="form-label">
                      <span>Inquiry Topic / Category</span>
                      <span class="required-mark" aria-hidden="true">*</span>
                    </label>
                    <div class="select-wrapper">
                      <select
                        id="contact-category"
                        v-model="selectedCategory"
                        class="form-select"
                        :disabled="isSubmitting"
                      >
                        <option
                          v-for="cat in subjectCategories"
                          :key="cat.value"
                          :value="cat.value"
                        >
                          {{ cat.label }}
                        </option>
                      </select>
                      <svg viewBox="0 0 20 20" fill="currentColor" class="select-arrow" aria-hidden="true">
                        <path
                          fill-rule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>

                    <!-- Custom Subject input when "Other" is chosen -->
                    <div v-if="isCustomSubject" class="custom-subject-wrap">
                      <input
                        v-model="form.customSubject"
                        type="text"
                        class="form-input custom-input"
                        placeholder="Please specify your subject"
                        maxlength="200"
                        :disabled="isSubmitting"
                      />
                    </div>
                    <p v-if="fieldErrors.subject" class="field-error-text">
                      {{ fieldErrors.subject[0] }}
                    </p>
                  </div>

                  <!-- 4. Message Content -->
                  <div class="form-group" :class="{ 'has-error': fieldErrors.message }">
                    <div class="label-with-counter">
                      <label for="contact-message" class="form-label">
                        <span>Your Message</span>
                        <span class="required-mark" aria-hidden="true">*</span>
                      </label>
                      <span class="char-counter" :class="{ 'counter-valid': isMessageValid }">
                        {{ charCount }} / {{ maxChars }} chars
                      </span>
                    </div>

                    <textarea
                      id="contact-message"
                      v-model="form.message"
                      rows="5"
                      class="form-textarea"
                      placeholder="Please share your inquiry details, preferred puja dates, or questions here..."
                      maxlength="2000"
                      required
                      :disabled="isSubmitting"
                    ></textarea>

                    <p v-if="fieldErrors.message" class="field-error-text">
                      {{ fieldErrors.message[0] }}
                    </p>
                    <p v-else class="field-hint">
                      Minimum 5 characters. Please do not submit financial or password information.
                    </p>
                  </div>

                  <!-- Devotee Assurance Pill -->
                  <div class="assurance-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="assurance-icon" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Your personal information is kept strictly confidential per Mandir Trust policy.</span>
                  </div>

                  <!-- Submit Action Button -->
                  <div class="form-actions">
                    <button
                      type="submit"
                      class="btn btn-submit"
                      :disabled="isSubmitting"
                    >
                      <span v-if="isSubmitting" class="submitting-inline">
                        <svg class="spinner" viewBox="0 0 24 24" fill="none">
                          <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                          ></circle>
                          <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Sending Message...</span>
                      </span>

                      <span v-else class="btn-label-group">
                        <span>Send Message</span>
                        <svg viewBox="0 0 20 20" fill="currentColor" class="btn-arrow" aria-hidden="true">
                          <path
                            fill-rule="evenodd"
                            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* --------------------------------------------------------------------------
   CONTACT PAGE DESIGN SYSTEM (Palette A: Sindoor & Gold / Cream Ground)
   Adheres to WCAG AA Contrast, authentic temple typography, clean card layout
-------------------------------------------------------------------------- */

.contact-page {
  width: 100%;
  min-height: 80vh;
  background-color: var(--bg-primary, #F7EFE0);
  color: var(--text-primary, #2B1A17);
  padding-bottom: 5rem;
}

.contact-container {
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
.contact-hero {
  padding: 2rem 0 3rem;
  text-align: center;
  position: relative;
}

.hero-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 820px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.95rem;
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
  margin: 0 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.bengali-title {
  font-family: inherit;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--maroon, #6E0516);
  letter-spacing: 0.02em;
}

.english-title {
  font-family: "Cinzel", Georgia, serif;
  font-size: 2.75rem;
  font-weight: 800;
  color: var(--maroon, #6E0516);
  line-height: 1.15;
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
  color: var(--text-secondary, rgba(43, 26, 23, 0.75));
  margin: 0 0 1.75rem;
  max-width: 680px;
}

.hero-quick-status {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.55rem 1.25rem;
  background: var(--bg-card, #FFFFFF);
  border: 1px solid var(--border-color, rgba(224, 165, 38, 0.45));
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary, #2B1A17);
  box-shadow: 0 2px 10px rgba(110, 5, 22, 0.04);
}

.status-indicator {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background-color: #16a34a;
  display: inline-block;
  margin-right: 0.35rem;
}

.status-divider {
  color: var(--border-color, rgba(224, 165, 38, 0.45));
}

/* Two-Column Grid Layout */
.contact-content-section {
  padding-top: 0.5rem;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 960px) {
  .contact-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
}

/* Info Cards (Left Column) */
.info-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-card {
  background: var(--bg-card, #FFFFFF);
  border: 1px solid var(--border-color, rgba(224, 165, 38, 0.45));
  border-radius: 12px;
  padding: 1.75rem;
  box-shadow: 0 4px 18px rgba(110, 5, 22, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--border-subtle, rgba(110, 5, 22, 0.1));
}

.card-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background-color: rgba(110, 5, 22, 0.06);
  color: var(--maroon, #6E0516);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon-wrap svg {
  width: 22px;
  height: 22px;
}

.card-title {
  font-family: "Cinzel", Georgia, serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--maroon, #6E0516);
  margin: 0;
  line-height: 1.2;
}

.card-subtitle-bn {
  display: block;
  font-size: 0.8125rem;
  color: var(--text-muted, rgba(43, 26, 23, 0.6));
  margin-top: 0.2rem;
}

/* Location Card Body */
.temple-formal-name {
  display: block;
  font-size: 1.05rem;
  color: var(--maroon, #6E0516);
  margin-bottom: 0.5rem;
}

.address-text {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-primary, #2B1A17);
  margin: 0 0 0.5rem;
}

.landmark-text {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--text-muted, rgba(43, 26, 23, 0.65));
  margin: 0 0 1.25rem;
}

.btn-directions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.15rem;
  background: rgba(110, 5, 22, 0.05);
  border: 1px solid var(--border-color, rgba(224, 165, 38, 0.45));
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--maroon, #6E0516);
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-directions:hover {
  background: var(--maroon, #6E0516);
  color: #FFFFFF;
}

.action-icon {
  width: 16px;
  height: 16px;
}

/* Timings Card List */
.timings-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.timing-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px dashed rgba(110, 5, 22, 0.1);
}

.timing-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.timing-meta {
  display: flex;
  flex-direction: column;
}

.timing-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary, #2B1A17);
}

.timing-desc {
  font-size: 0.775rem;
  color: var(--text-muted, rgba(43, 26, 23, 0.6));
}

.timing-value {
  font-family: "Cinzel", Georgia, serif;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--maroon, #6E0516);
  white-space: nowrap;
}

.timing-value.closed {
  color: var(--text-muted, rgba(43, 26, 23, 0.5));
  font-style: italic;
  font-family: inherit;
}

.highlight-row {
  background: rgba(224, 165, 38, 0.09);
  padding: 0.65rem 0.85rem;
  border-radius: 6px;
  border-bottom: none;
}

/* Contacts Channels List */
.channels-list {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.channel-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0.85rem;
  background: rgba(110, 5, 22, 0.02);
  border: 1px solid var(--border-subtle, rgba(110, 5, 22, 0.08));
  border-radius: 8px;
}

.channel-info {
  display: flex;
  flex-direction: column;
}

.channel-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, rgba(43, 26, 23, 0.6));
  margin-bottom: 0.15rem;
}

.channel-link {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--maroon, #6E0516);
  text-decoration: none;
  transition: color 0.15s ease;
}

.channel-link:hover {
  color: var(--gold, #E0A526);
  text-decoration: underline;
}

.channel-action-btn {
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  background: rgba(110, 5, 22, 0.07);
  border: 1px solid var(--border-color, rgba(224, 165, 38, 0.45));
  color: var(--maroon, #6E0516);
  font-size: 0.8125rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.15s ease;
}

.channel-action-btn:hover {
  background: var(--maroon, #6E0516);
  color: #FFFFFF;
}

.whatsapp-btn {
  background: rgba(37, 211, 102, 0.12);
  border-color: rgba(37, 211, 102, 0.4);
  color: #128C7E;
}

.whatsapp-btn:hover {
  background: #128C7E;
  color: #FFFFFF;
}

/* Notice Card (Emergency / Antim Sanskar) */
.notice-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: rgba(224, 165, 38, 0.15);
  border: 1px solid var(--gold, #E0A526);
  border-radius: 10px;
}

.notice-icon {
  color: var(--maroon, #6E0516);
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.notice-title {
  font-size: 0.9375rem;
  font-weight: 800;
  color: var(--maroon, #6E0516);
  margin: 0 0 0.25rem;
}

.notice-desc {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-primary, #2B1A17);
  margin: 0;
}

/* RIGHT COLUMN: Inquiry Form Card */
.inquiry-form-card {
  background: var(--bg-card, #FFFFFF);
  border: 1.5px solid var(--border-color, rgba(224, 165, 38, 0.45));
  border-radius: 14px;
  padding: 2.25rem;
  box-shadow: 0 8px 30px rgba(110, 5, 22, 0.05);
}

@media (max-width: 640px) {
  .inquiry-form-card {
    padding: 1.5rem;
  }
}

.form-header {
  margin-bottom: 1.75rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-subtle, rgba(110, 5, 22, 0.1));
}

.form-title {
  font-family: "Cinzel", Georgia, serif;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--maroon, #6E0516);
  margin: 0 0 0.25rem;
}

.form-title-bn {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gold, #E0A526);
  margin-bottom: 0.5rem;
}

.form-description {
  font-size: 0.925rem;
  line-height: 1.55;
  color: var(--text-secondary, rgba(43, 26, 23, 0.7));
  margin: 0;
}

/* Alert Error Banner */
.alert-error {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.95rem 1.15rem;
  margin-bottom: 1.5rem;
  background-color: #FEF2F2;
  border: 1px solid #F87171;
  border-radius: 8px;
  color: #991B1B;
}

.alert-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.alert-heading {
  font-weight: 800;
  font-size: 0.875rem;
  display: block;
  margin-bottom: 0.15rem;
}

.alert-text {
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0;
}

/* Form Styles */
.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Honeypot hidden input */
.hp-field {
  position: absolute;
  left: -9999px;
  opacity: 0;
  height: 0;
  width: 0;
  overflow: hidden;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 600px) {
  .form-row-2 {
    grid-template-columns: 1fr;
  }
}

.form-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary, #2B1A17);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.required-mark {
  color: #DC2626;
  font-weight: 800;
}

.optional-mark {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted, rgba(43, 26, 23, 0.5));
}

.label-with-counter {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-counter {
  font-size: 0.75rem;
  color: var(--text-muted, rgba(43, 26, 23, 0.5));
  font-weight: 600;
}

.char-counter.counter-valid {
  color: #16A34A;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem 0.95rem;
  font-family: inherit;
  font-size: 0.9375rem;
  color: var(--text-primary, #2B1A17);
  background-color: #FAFAFA;
  border: 1.5px solid var(--border-subtle, rgba(110, 5, 22, 0.15));
  border-radius: 8px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  background-color: #FFFFFF;
  border-color: var(--maroon, #6E0516);
  box-shadow: 0 0 0 3px rgba(110, 5, 22, 0.12);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.select-wrapper {
  position: relative;
}

.form-select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 2.5rem;
  cursor: pointer;
}

.select-arrow {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--maroon, #6E0516);
  pointer-events: none;
}

.custom-subject-wrap {
  margin-top: 0.5rem;
}

.field-error-text {
  font-size: 0.8rem;
  color: #DC2626;
  font-weight: 600;
  margin: 0.2rem 0 0;
}

.field-hint {
  font-size: 0.75rem;
  color: var(--text-muted, rgba(43, 26, 23, 0.55));
  margin: 0.2rem 0 0;
}

.has-error .form-input,
.has-error .form-textarea,
.has-error .form-select {
  border-color: #DC2626;
  background-color: #FFF5F5;
}

/* Assurance Pill */
.assurance-pill {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.65rem 0.85rem;
  background: rgba(110, 5, 22, 0.03);
  border: 1px dashed var(--border-color, rgba(224, 165, 38, 0.45));
  border-radius: 6px;
  font-size: 0.775rem;
  color: var(--text-secondary, rgba(43, 26, 23, 0.75));
}

.assurance-icon {
  width: 16px;
  height: 16px;
  color: var(--gold, #E0A526);
  flex-shrink: 0;
}

/* Form Action Buttons */
.form-actions {
  margin-top: 0.75rem;
}

.btn-submit {
  width: 100%;
  padding: 0.95rem 1.5rem;
  background: var(--maroon, #6E0516);
  color: #FFFFFF;
  border: 1px solid var(--border-color, rgba(224, 165, 38, 0.5));
  border-radius: 9px;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  box-shadow: 0 4px 14px rgba(110, 5, 22, 0.25);
  transition: all 0.2s ease;
}

.btn-submit:hover:not(:disabled) {
  background: var(--maroon-deep, #3F0A12);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(110, 5, 22, 0.35);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-label-group {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-arrow {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

.btn-submit:hover .btn-arrow {
  transform: translateX(3px);
}

.submitting-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
}

.spinner {
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Success Confirmation State */
.form-success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem 1rem;
}

.success-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(22, 163, 74, 0.12);
  color: #16A34A;
  border: 2px solid rgba(22, 163, 74, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.success-icon-wrap svg {
  width: 32px;
  height: 32px;
}

.success-title {
  font-family: "Cinzel", Georgia, serif;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--maroon, #6E0516);
  margin: 0 0 0.25rem;
}

.success-subtitle-bn {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--gold, #E0A526);
  margin: 0 0 1rem;
}

.success-message {
  font-size: 1rem;
  line-height: 1.55;
  color: var(--text-primary, #2B1A17);
  margin: 0 0 1.25rem;
  max-width: 440px;
}

.reference-box {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1.5rem;
  background: rgba(224, 165, 38, 0.12);
  border: 1px dashed var(--gold, #E0A526);
  border-radius: 8px;
  margin-bottom: 1.25rem;
}

.ref-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, rgba(43, 26, 23, 0.65));
}

.ref-value {
  font-family: "Cinzel", Georgia, serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--maroon, #6E0516);
  letter-spacing: 0.05em;
}

.success-note {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text-secondary, rgba(43, 26, 23, 0.7));
  margin: 0 0 1.75rem;
  max-width: 460px;
}

.btn-reset {
  padding: 0.75rem 1.5rem;
  background: var(--bg-card, #FFFFFF);
  border: 1.5px solid var(--maroon, #6E0516);
  color: var(--maroon, #6E0516);
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-reset:hover {
  background: var(--maroon, #6E0516);
  color: #FFFFFF;
}
</style>
