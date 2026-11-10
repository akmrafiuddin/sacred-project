<script setup lang="ts">
import { ref, onMounted, watchEffect } from "vue";
import { useAuth } from "~/composables/useAuth";

useHead({
  title: "Sanctum Dashboard - Temple Console",
});

const { isAuthenticated, isStaff, isAdmin, isEditor, currentUser, role, logout } = useAuth();

// Route guard - only admin or editor can access /admin/**
watchEffect(() => {
  if (!isAuthenticated.value) {
    navigateTo("/admin/login");
  } else if (!isStaff.value) {
    navigateTo("/account");
  }
});

const isSidebarOpen = ref(false);
const activeModule = ref("dashboard");

// Current date formatted
const formattedDate = ref("");
onMounted(() => {
  const d = new Date();
  formattedDate.value = d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Admin Navigation Menu items
const navItems = [
  { id: "dashboard", label: "Dashboard Overview", badge: "Live", link: "/admin/dashboard" },
];

</script>

<template>
  <div class="admin-layout">
    <!-- MOBILE SIDEBAR BACKDROP -->
    <div
      v-if="isSidebarOpen"
      class="sidebar-backdrop"
      @click="isSidebarOpen = false"
    ></div>

    <!-- 1. SIDEBAR -->
    <aside class="admin-sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
      <!-- Sidebar Header / Logo -->
      <div class="sidebar-header">
        <NuxtLink to="/" class="sidebar-logo">
          <div class="logo-mark">
            <svg viewBox="0 0 32 32" fill="none" class="temple-svg-icon" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L19 7H13L16 2Z" fill="var(--accent)" />
              <path d="M11 8H21L22 13H10L11 8Z" fill="var(--accent)" fill-opacity="0.9" />
              <path d="M8 14H24L26 21H6L8 14Z" fill="var(--accent)" fill-opacity="0.8" />
              <path d="M4 22H28V29C28 29.5523 27.5523 30 27 30H5C4.44772 30 4 29.5523 4 29V22Z" fill="var(--accent)" fill-opacity="0.7" />
              <path d="M13 30V24C13 22.3431 14.3431 21 16 21C17.6569 21 19 22.3431 19 24V30H13Z" fill="var(--bg-primary)" />
            </svg>
          </div>
          <div class="logo-text">
            <span class="brand-title">TEMPLE</span>
            <span class="brand-tag">Super Admin</span>
          </div>
        </NuxtLink>

        <!-- Close button on mobile -->
        <button
          type="button"
          class="mobile-close-btn"
          aria-label="Close sidebar"
          @click="isSidebarOpen = false"
        >
          &times;
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="sidebar-nav" aria-label="Admin Navigation">
        <ul class="nav-list">
          <li v-for="item in navItems" :key="item.id">
            <NuxtLink
              v-if="item.link"
              :to="item.link"
              class="nav-item-btn"
              :class="{ 'item-active': activeModule === item.id }"
              @click="isSidebarOpen = false"
            >
              <span class="item-label">{{ item.label }}</span>
              <span v-if="item.badge" class="item-badge">{{ item.badge }}</span>
            </NuxtLink>
            <button
              v-else
              type="button"
              class="nav-item-btn"
              :class="{ 'item-active': activeModule === item.id }"
              @click="activeModule = item.id; isSidebarOpen = false"
            >
              <span class="item-label">{{ item.label }}</span>
              <span v-if="item.badge" class="item-badge">{{ item.badge }}</span>
            </button>
          </li>
        </ul>
      </nav>

      <!-- Sidebar User Profile & Logout -->
      <div class="sidebar-user-footer">
        <div class="user-info">
          <div class="user-details">
            <span class="user-name">{{ currentUser?.name || "Sanctum User" }}</span>
            <span class="user-role-badge" :class="isAdmin ? 'role-admin' : 'role-editor'">
              {{ isAdmin ? "Super Admin" : "Content Editor" }}
            </span>
          </div>
        </div>

        <button type="button" class="btn-logout" @click="() => logout()" title="Sign out of console">
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
    </aside>

    <!-- 2. MAIN ADMIN CONTENT WRAPPER -->
    <div class="admin-main-wrapper">
      <!-- TOPBAR -->
      <header class="admin-topbar">
        <div class="topbar-left">
          <button
            type="button"
            class="hamburger-btn"
            aria-label="Open sidebar"
            @click="isSidebarOpen = true"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div class="breadcrumb">
            <span class="crumb-root">Sanctum Console</span>
            <span class="crumb-sep">/</span>
            <span class="crumb-active">Overview Dashboard</span>
          </div>
        </div>

        <div class="topbar-right">
          <!-- Status Pill -->
          <div class="status-pill">
            <span class="status-dot"></span>
            <span>Sanctum Online</span>
          </div>

          <!-- Public site shortcut -->
          <NuxtLink to="/" target="_blank" class="btn-live-site">
            <span>View Public Portal</span>
            <svg viewBox="0 0 20 20" fill="currentColor" class="link-arrow">
              <path
                d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"
              />
              <path
                d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"
              />
            </svg>
          </NuxtLink>
        </div>
      </header>

      <!-- DASHBOARD BODY -->
      <main class="dashboard-body">
        <!-- Welcome Greeting Banner -->
        <div class="welcome-banner">
          <div class="welcome-text">
            <h1 class="welcome-heading">Super Administrator</h1>
            <p class="welcome-sub">
              {{ formattedDate }}
            </p>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  position: relative;
}

/* ====================================================
   1. SIDEBAR
   ==================================================== */
.admin-sidebar {
  width: 280px;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 100;
  transition: transform 0.25s ease;
}

@media (max-width: 1024px) {
  .admin-sidebar {
    transform: translateX(-100%);
  }

  .admin-sidebar.sidebar-open {
    transform: translateX(0);
  }
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 90;
}

.sidebar-header {
  height: 70px;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
}

.logo-mark {
  width: 32px;
  height: 32px;
}

.temple-svg-icon {
  width: 100%;
  height: 100%;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--text-primary);
  line-height: 1.1;
}

.brand-tag {
  font-size: 0.675rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--accent);
  letter-spacing: 0.08em;
}

.mobile-close-btn {
  display: none;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
}

@media (max-width: 1024px) {
  .mobile-close-btn {
    display: block;
  }
}

/* Sidebar Nav */
.sidebar-nav {
  flex: 1;
  padding: 1.5rem 1rem;
  overflow-y: auto;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.nav-item-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.95rem;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  text-align: left;
}

.nav-item-btn:hover {
  background: var(--action-btn-bg);
  color: var(--text-primary);
}

.nav-item-btn.item-active {
  background: var(--accent-glow);
  border-color: rgba(245, 158, 11, 0.3);
  color: var(--accent);
  font-weight: 700;
}

.item-icon {
  font-size: 1.1rem;
}

.item-label {
  flex: 1;
}

.item-badge {
  font-size: 0.725rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  background: var(--action-btn-bg);
  color: var(--text-muted);
}

.item-active .item-badge {
  background: var(--accent);
  color: var(--btn-cta-text, #3F0A12);
}

/* User Footer in Sidebar */
.sidebar-user-footer {
  padding: 1.25rem 1.25rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  font-size: 1.4rem;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--accent-glow);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
}

.user-role-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  width: fit-content;
  margin-top: 0.2rem;
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

.user-role {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--accent-text);
  letter-spacing: 0.06em;
}

.btn-logout {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem;
  border-radius: 8px;
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.logout-icon {
  width: 16px;
  height: 16px;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

/* ====================================================
   2. MAIN WRAPPER & TOPBAR
   ==================================================== */
.admin-main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 280px;
  min-width: 0;
}

@media (max-width: 1024px) {
  .admin-main-wrapper {
    margin-left: 0;
  }
}

.admin-topbar {
  height: 70px;
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hamburger-btn {
  display: none;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 0.25rem;
}

.hamburger-btn svg {
  width: 22px;
  height: 22px;
}

@media (max-width: 1024px) {
  .hamburger-btn {
    display: block;
  }
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.crumb-root {
  color: var(--text-muted);
}

.crumb-sep {
  color: var(--text-muted);
  opacity: 0.5;
}

.crumb-active {
  font-weight: 700;
  color: var(--text-primary);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.25);
  font-size: 0.775rem;
  font-weight: 700;
  color: #22c55e;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulseDot 2s infinite;
}

@keyframes pulseDot {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
}

.btn-live-site {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.95rem;
  border-radius: 8px;
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-live-site:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.link-arrow {
  width: 14px;
  height: 14px;
}

/* ====================================================
   3. DASHBOARD BODY & KPI
   ==================================================== */
.dashboard-body {
  padding: 2.25rem 2rem 4rem;
  max-width: 1300px;
  width: 100%;
}

.welcome-banner {
  margin-bottom: 2.25rem;
}

.welcome-badge {
  font-size: 0.725rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--accent);
  text-transform: uppercase;
}

.welcome-heading {
  font-size: clamp(1.65rem, 2.8vw, 2.25rem);
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.025em;
  margin: 0.35rem 0 0.45rem;
}

.welcome-sub {
  font-size: 0.925rem;
  color: var(--text-secondary);
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2.5rem;
}

.kpi-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  transition: all 0.2s ease;
}

.kpi-card:hover {
  border-color: rgba(245, 158, 11, 0.4);
  transform: translateY(-2px);
}

.kpi-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.gold-icon {
  background: var(--accent-glow);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.blue-icon {
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.green-icon {
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.purple-icon {
  background: rgba(168, 85, 247, 0.12);
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.kpi-content {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.kpi-val {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
  margin-bottom: 0.35rem;
}

.kpi-trend {
  font-size: 0.775rem;
  color: var(--text-muted);
}

.trend-up {
  color: #22c55e;
  font-weight: 700;
}

/* ====================================================
   4. OPERATIONS LAYOUT & PANELS
   ==================================================== */
.ops-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1080px) {
  .ops-grid {
    grid-template-columns: 1.6fr 1fr;
  }
}

.ops-left,
.ops-right {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dash-panel {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 1.75rem;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.panel-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.panel-tag {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-glow);
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
}

/* Ritual Rows */
.ritual-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.ritual-row {
  display: grid;
  grid-template-columns: 85px 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: var(--action-btn-bg);
  border: 1px solid transparent;
}

.ritual-row.ritual-active {
  border-color: rgba(245, 158, 11, 0.4);
  background: var(--accent-glow);
}

.r-time {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.r-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.r-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
}

.badge-done {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.badge-next {
  background: var(--accent);
  color: var(--btn-cta-text, #3F0A12);
  font-weight: 800;
  animation: pulsePill 2s infinite;
}

@keyframes pulsePill {
  0% { opacity: 0.9; }
  50% { opacity: 1; }
  100% { opacity: 0.9; }
}

.badge-scheduled {
  background: var(--action-btn-bg);
  color: var(--text-muted);
}

/* Activity Table */
.activity-table-wrap {
  overflow-x: auto;
}

.activity-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  text-align: left;
}

.activity-table th {
  padding: 0.75rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
}

.activity-table td {
  padding: 0.95rem 0.75rem;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.devotee-cell {
  display: flex;
  flex-direction: column;
}

.d-name {
  font-weight: 700;
  color: var(--text-primary);
}

.d-gotra {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.amount-cell {
  font-weight: 700;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.status-tag {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
}

.tag-success {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

/* Quick Actions Grid */
.quick-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.25rem 0.75rem;
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  color: var(--text-primary);
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.action-btn:hover {
  border-color: var(--accent);
  background: var(--accent-glow);
  color: var(--accent-light);
  transform: translateY(-2px);
}

.action-btn-icon {
  font-size: 1.4rem;
}

/* Roadmap Box */
.roadmap-panel {
  background: var(--bg-card);
  border-color: rgba(245, 158, 11, 0.3);
}

.roadmap-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--accent);
  margin-bottom: 0.45rem;
}

.roadmap-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.roadmap-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.55;
  margin-bottom: 1.25rem;
}

.roadmap-features {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.825rem;
  color: var(--text-primary);
}

.check-mark {
  color: var(--accent);
  font-weight: 800;
}

/* System Health */
.health-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.health-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-secondary);
  padding: 0.45rem 0;
  border-bottom: 1px solid var(--border-subtle);
}

.health-badge {
  font-size: 0.725rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
}

.badge-green {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

@media (max-width: 768px) {
  .admin-topbar {
    padding: 0 1.25rem;
  }

  .dashboard-body {
    padding: 1.5rem 1.25rem 3rem;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
