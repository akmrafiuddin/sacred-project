<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useAuth } from "~/composables/useAuth";

useHead({
  title: "Sanctum Login - Temple Console",
});

const { isAuthenticated, isStaff, isUser, login } = useAuth();

// If already logged in, redirect based on role
watchEffect(() => {
  if (isAuthenticated.value) {
    if (isStaff.value) {
      navigateTo("/admin/dashboard");
    } else if (isUser.value) {
      navigateTo("/account");
    }
  }
});

const email = ref("admin@temple.org");
const password = ref("admin123456");
const showPassword = ref(false);
const rememberMe = ref(true);
const isLoading = ref(false);
const errorMessage = ref("");

const handleLogin = async () => {
  errorMessage.value = "";
  if (!email.value || !password.value) {
    errorMessage.value = "Please enter both email and password.";
    return;
  }

  isLoading.value = true;
  try {
    const res = await login(email.value, password.value, rememberMe.value);
    if (res.success) {
      if (res.role === "admin" || res.role === "editor") {
        await navigateTo("/admin/dashboard");
      } else {
        await navigateTo("/account");
      }
    } else {
      errorMessage.value = res.error || "Authentication failed. Please verify credentials.";
    }
  } catch (err: any) {
    errorMessage.value = err?.message || "An unexpected error occurred.";
  } finally {
    isLoading.value = false;
  }
};

const fillDemoCredentials = () => {
  email.value = "admin@temple.org";
  password.value = "admin123456";
  errorMessage.value = "";
};
</script>

<template>
  <div class="login-wrapper">
    <!-- Ambient Temple Glow Background -->
    <div class="login-bg-glow" aria-hidden="true"></div>

    <div class="login-card-container">
      <!-- Return to site link -->
      <NuxtLink to="/" class="back-link">
        <svg viewBox="0 0 20 20" fill="currentColor" class="back-arrow">
          <path
            fill-rule="evenodd"
            d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
            clip-rule="evenodd"
          />
        </svg>
        <span>Return to Temple Portal</span>
      </NuxtLink>

      <div class="login-card">
        <!-- Logo Header -->
        <div class="login-header">
          <div class="logo-emblem">
            <svg viewBox="0 0 32 32" fill="none" class="temple-svg-icon" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L19 7H13L16 2Z" fill="var(--accent)" />
              <path d="M11 8H21L22 13H10L11 8Z" fill="var(--accent)" fill-opacity="0.9" />
              <path d="M8 14H24L26 21H6L8 14Z" fill="var(--accent)" fill-opacity="0.8" />
              <path d="M4 22H28V29C28 29.5523 27.5523 30 27 30H5C4.44772 30 4 29.5523 4 29V22Z" fill="var(--accent)" fill-opacity="0.7" />
              <path d="M13 30V24C13 22.3431 14.3431 21 16 21C17.6569 21 19 22.3431 19 24V30H13Z" fill="var(--bg-primary)" />
            </svg>
          </div>
          <span class="badge-role">SUPER ADMIN GATEWAY</span>
          <h1 class="login-title">Sanctum Console</h1>
          <p class="login-subtitle">Authenticate to manage rituals, sevas, deities, and temple records</p>
        </div>

        <!-- Error Notification -->
        <div v-if="errorMessage" class="error-banner" role="alert">
          <svg viewBox="0 0 20 20" fill="currentColor" class="error-icon">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Form -->
        <form class="login-form" @submit.prevent="handleLogin">
          <!-- Email Field -->
          <div class="form-group">
            <label for="admin-email" class="form-label">Super Admin Email</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                id="admin-email"
                v-model="email"
                type="email"
                required
                autocomplete="username"
                class="form-input"
                placeholder="admin@temple.org"
              />
            </div>
          </div>

          <!-- Password Field -->
          <div class="form-group">
            <div class="label-row">
              <label for="admin-password" class="form-label">Security Password</label>
              <button
                type="button"
                class="btn-toggle-pass"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? "Hide" : "Show" }}
              </button>
            </div>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="admin-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                class="form-input"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <!-- Options Row -->
          <div class="options-row">
            <label class="checkbox-label">
              <input v-model="rememberMe" type="checkbox" class="form-checkbox" />
              <span>Remember 7-day session</span>
            </label>
            <span class="security-badge">
              <svg viewBox="0 0 12 12" fill="currentColor" class="lock-mini">
                <path d="M6 1a2 2 0 00-2 2v2H3a1 1 0 00-1 1v5a1 1 0 001 1h6a1 1 0 001-1V6a1 1 0 00-1-1H8V3a2 2 0 00-2-2zm-1 4V3a1 1 0 112 0v2H5z" />
              </svg>
              256-Bit Encrypted
            </span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn-submit"
            :disabled="isLoading"
          >
            <span v-if="!isLoading" class="btn-text">Sign In to Sanctum Console &rarr;</span>
            <span v-else class="btn-loading">
              <span class="btn-spinner"></span>
              Authenticating...
            </span>
          </button>
        </form>

        <!-- Quick Demo Credentials Helper -->
        <div class="demo-box">
          <div class="demo-content">
            <span class="demo-title">Demo Credentials:</span>
            <span class="demo-creds">
              <code class="helper-code">admin@temple.org</code> / <code class="helper-code">admin123456</code>
            </span>
          </div>
          <button type="button" class="btn-autofill" @click="fillDemoCredentials">
            Auto-fill
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding: 2.5rem 1.5rem;
  overflow: hidden;
}

.login-bg-glow {
  display: none;
}

.login-card-container {
  width: 100%;
  max-width: 460px;
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.15s ease;
  width: fit-content;
}

.back-link:hover {
  color: var(--accent);
}

.back-arrow {
  width: 16px;
  height: 16px;
}

.login-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2.5rem 2.25rem;
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(12px);
}

.login-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.logo-emblem {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  filter: drop-shadow(0 4px 12px var(--accent-glow));
}

.temple-svg-icon {
  width: 100%;
  height: 100%;
}

.badge-role {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--accent-text);
  background-color: var(--accent-glow);
  border: 1px solid var(--border-color);
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  margin-bottom: 0.65rem;
}

.login-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin-bottom: 0.45rem;
}

.login-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-label {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-toggle-pass {
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.85rem;
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 0.75rem 0.85rem 0.75rem 2.6rem;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.925rem;
  font-family: inherit;
  transition: all 0.15s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.options-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
}

.form-checkbox {
  accent-color: var(--accent);
  cursor: pointer;
}

.security-badge {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.lock-mini {
  width: 11px;
  height: 11px;
  color: var(--accent);
}

.btn-submit {
  width: 100%;
  padding: 0.85rem;
  background: var(--accent);
  color: var(--btn-cta-text, #3F0A12);
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-top: 0.5rem;
  font-family: inherit;
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn-submit:hover:not(:disabled) {
  background: var(--accent-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px var(--accent-glow);
}

.btn-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(63, 10, 18, 0.3);
  border-top-color: var(--btn-cta-text, #3F0A12);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.demo-box {
  margin-top: 1.5rem;
  padding: 0.85rem 1rem;
  background-color: rgba(245, 158, 11, 0.06);
  border: 1px dashed rgba(245, 158, 11, 0.25);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.demo-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.775rem;
}

.demo-title {
  color: var(--text-muted);
  font-weight: 600;
}

.demo-creds {
  color: var(--text-secondary);
}

.helper-code {
  background-color: rgba(0, 0, 0, 0.2);
  color: var(--accent);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
}

.btn-autofill {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-autofill:hover {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
