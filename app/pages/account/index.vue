<script setup lang="ts">
import { watchEffect } from "vue";
import { useAuth } from "~/composables/useAuth";

useHead({
  title: "Devotee Portal - My Account",
});

const { isAuthenticated, isPending, isStaff, currentUser, role, logout } = useAuth();

// Route guard: /account requires login
watchEffect(() => {
  if (isPending.value) return;

  if (!isAuthenticated.value) {
    navigateTo("/admin/login");
  }
});
</script>

<template>
  <div class="account-page-wrapper">
    <div class="account-container">
      <!-- Breadcrumb / Return -->
      <div class="top-nav-bar">
        <NuxtLink to="/" class="back-link">
          <svg viewBox="0 0 20 20" fill="currentColor" class="back-icon">
            <path
              fill-rule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
              clip-rule="evenodd"
            />
          </svg>
          <span>Return to Mandir Portal</span>
        </NuxtLink>

        <NuxtLink v-if="isStaff" to="/admin/dashboard" class="staff-badge-link">
          <svg viewBox="0 0 20 20" fill="currentColor" class="staff-icon">
            <path
              fill-rule="evenodd"
              d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"
              clip-rule="evenodd"
            />
          </svg>
          <span>Sanctum Admin Console</span>
        </NuxtLink>
      </div>

      <!-- Hero Header -->
      <div class="account-header">
        <div class="header-emblem">
          <svg viewBox="0 0 32 32" fill="none" class="temple-svg-icon" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2L19 7H13L16 2Z" fill="var(--accent)" />
            <path d="M11 8H21L22 13H10L11 8Z" fill="var(--accent)" fill-opacity="0.9" />
            <path d="M8 14H24L26 21H6L8 14Z" fill="var(--accent)" fill-opacity="0.8" />
            <path d="M4 22H28V29C28 29.5523 27.5523 30 27 30H5C4.44772 30 4 29.5523 4 29V22Z" fill="var(--accent)" fill-opacity="0.7" />
            <path d="M13 30V24C13 22.3431 14.3431 21 16 21C17.6569 21 19 22.3431 19 24V30H13Z" fill="var(--bg-primary)" />
          </svg>
        </div>
        <div class="header-titles">
          <span class="eyebrow">DEVOTEE PORTAL</span>
          <h1 class="account-title">My Account & Seva Requests</h1>
          <p class="account-subtitle">
            Manage your personal profile and track your registered puja sankalp requests.
          </p>
        </div>
      </div>

      <div class="account-grid">
        <!-- 1. Profile Card -->
        <div class="card profile-card">
          <div class="card-header">
            <h2 class="card-title">Profile Information</h2>
            <span class="role-pill" :class="'role-' + role">
              {{ role === 'admin' ? 'Super Admin' : role === 'editor' ? 'Content Editor' : 'Devotee' }}
            </span>
          </div>

          <div class="profile-details-list">
            <div class="detail-row">
              <span class="detail-label">Full Name</span>
              <span class="detail-val">{{ currentUser?.name || 'Devotee' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email Address</span>
              <span class="detail-val">{{ currentUser?.email || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Contact Phone</span>
              <span class="detail-val">{{ currentUser?.phone || 'Not provided' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Devotee ID</span>
              <span class="detail-val code-val">{{ currentUser?.id || '—' }}</span>
            </div>
          </div>

          <div class="profile-actions">
            <button type="button" class="btn-logout" @click="logout('/')">
              <svg viewBox="0 0 20 20" fill="currentColor" class="logout-icon">
                <path
                  fill-rule="evenodd"
                  d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <!-- 2. My Bookings Card -->
        <div class="card bookings-card">
          <div class="card-header">
            <h2 class="card-title">My Puja Booking Requests</h2>
            <span class="count-badge">0 Active</span>
          </div>

          <div class="empty-bookings-box">
            <div class="empty-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="empty-icon" stroke-width="1.5">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
            </div>
            <h3 class="empty-title">No Puja Requests Yet</h3>
            <p class="empty-desc">
              When you submit a puja booking request online, your request details and temple confirmation status will be listed here.
            </p>
            <NuxtLink to="/#pujas" class="book-puja-btn">
              Browse Daily Pujas & Book
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.account-page-wrapper {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding: 3rem 1.5rem 5rem;
}

.account-container {
  max-width: 1040px;
  margin: 0 auto;
}

.top-nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.back-link,
.staff-badge-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--accent);
}

.staff-badge-link {
  background: rgba(245, 158, 11, 0.12);
  color: var(--accent-text);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
}

.staff-badge-link:hover {
  background: rgba(245, 158, 11, 0.2);
}

.back-icon,
.staff-icon {
  width: 18px;
  height: 18px;
}

.account-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.header-emblem {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.temple-svg-icon {
  width: 36px;
  height: 36px;
}

.eyebrow {
  display: block;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--accent-text);
  margin-bottom: 0.25rem;
}

.account-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 0.35rem 0;
  line-height: 1.2;
}

.account-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0;
}

.account-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.75rem;
}

@media (min-width: 860px) {
  .account-grid {
    grid-template-columns: 360px 1fr;
  }
}

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.role-pill {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  letter-spacing: 0.05em;
}

.role-admin {
  background: rgba(245, 158, 11, 0.15);
  color: var(--accent-text);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.role-editor {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.role-user {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.profile-details-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: var(--text-secondary);
}

.detail-val {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.code-val {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-secondary);
  word-break: break-all;
}

.profile-actions {
  margin-top: auto;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color);
}

.btn-logout {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.logout-icon {
  width: 18px;
  height: 18px;
}

.count-badge {
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(148, 163, 184, 0.15);
  color: var(--text-secondary);
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
}

.empty-bookings-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1.5rem;
  margin: auto 0;
}

.empty-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.1);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.empty-icon {
  width: 28px;
  height: 28px;
}

.empty-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  max-width: 440px;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.book-puja-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  background: var(--accent);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.book-puja-btn:hover {
  opacity: 0.9;
}
</style>
