<script setup lang="ts">
import { ref, reactive, computed, onMounted, watchEffect } from "vue";
import { useAuth } from "~/composables/useAuth";
import type { FormattedScheduleItem, NextAartiResult } from "~~/server/services/schedule";
import type { FormattedPujaItem } from "~~/server/services/pujas";

useHead({
  title: "Sanctum Dashboard - Temple Console",
});

const { isAuthenticated, isStaff, isAdmin, isEditor, currentUser, role, logout } = useAuth();
const { $trpc } = useNuxtApp();

// Route guard - only admin or editor can access /admin/**
watchEffect(() => {
  if (!isAuthenticated.value) {
    navigateTo("/admin/login");
  } else if (!isStaff.value) {
    navigateTo("/account");
  }
});

const isSidebarOpen = ref(false);
const activeModule = ref<"dashboard" | "schedule" | "pujas">("dashboard");

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
  { id: "dashboard", label: "Dashboard Overview", icon: "📊", badge: "Live" },
  { id: "schedule", label: "Daily Schedule", icon: "🔔", badge: "Rituals" },
  { id: "pujas", label: "Pujas & Services", icon: "🪔", badge: "Offerings" },
];

// =========================================================================
// TOAST NOTIFICATIONS
// =========================================================================
const toast = reactive({
  show: false,
  message: "",
  type: "success" as "success" | "error" | "info",
});

const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  setTimeout(() => {
    toast.show = false;
  }, 4000);
};

// =========================================================================
// DAILY SCHEDULE STATE & CRUD
// =========================================================================
const scheduleItems = ref<FormattedScheduleItem[]>([]);
const nextAartiInfo = ref<NextAartiResult | null>(null);
const loadingSchedule = ref(false);
const searchQuery = ref("");
const statusFilter = ref<"all" | "active" | "hidden">("all");

// Fetch Schedule Items from backend (tRPC) and public schedule for Next Aarti
const fetchScheduleData = async () => {
  loadingSchedule.value = true;
  try {
    const res = await $trpc.schedule.list.query();
    scheduleItems.value = res.items || [];

    // Also fetch public calculation for next aarti
    const pub = await $fetch<{ items: FormattedScheduleItem[]; nextAarti: NextAartiResult | null }>(
      "/api/public/schedule"
    ).catch(() => null);
    if (pub) {
      nextAartiInfo.value = pub.nextAarti;
    }
  } catch (err: any) {
    console.error("Failed to load schedule:", err);
    showToast(err?.message || "Failed to load schedule data", "error");
  } finally {
    loadingSchedule.value = false;
  }
};

onMounted(() => {
  fetchScheduleData();
  fetchPujasData();
});

// Filtered schedule list
const filteredSchedule = computed(() => {
  return scheduleItems.value.filter((item) => {
    // 1. Status filter
    if (statusFilter.value === "active" && !item.active) return false;
    if (statusFilter.value === "hidden" && item.active) return false;

    // 2. Search query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase();
      const matchTime = item.time.toLowerCase().includes(q);
      const matchTitleEn = item.title.en.toLowerCase().includes(q);
      const matchTitleBn = (item.title.bn || "").toLowerCase().includes(q);
      const matchDescEn = (item.description.en || "").toLowerCase().includes(q);
      const matchDescBn = (item.description.bn || "").toLowerCase().includes(q);
      return matchTime || matchTitleEn || matchTitleBn || matchDescEn || matchDescBn;
    }

    return true;
  });
});

// Stats computed
const totalRitualsCount = computed(() => scheduleItems.value.length);
const activeRitualsCount = computed(() => scheduleItems.value.filter((i) => i.active).length);
const hiddenRitualsCount = computed(() => scheduleItems.value.filter((i) => !i.active).length);

// Modal state
const isModalOpen = ref(false);
const isEditing = ref(false);
const savingItem = ref(false);
const currentEditingId = ref<number | null>(null);
const activeLangTab = ref<"en" | "bn">("en");

const itemForm = reactive({
  time: "",
  titleEn: "",
  titleBn: "",
  descEn: "",
  descBn: "",
  sortOrder: 0,
  active: true,
});

const formErrors = reactive({
  time: "",
  titleEn: "",
});

// Presets for quick time picking
const timePresets = ["05:00", "07:00", "12:30", "18:30", "21:30"];

const openAddModal = () => {
  isEditing.value = false;
  currentEditingId.value = null;
  itemForm.time = "";
  itemForm.titleEn = "";
  itemForm.titleBn = "";
  itemForm.descEn = "";
  itemForm.descBn = "";
  itemForm.sortOrder = scheduleItems.value.length + 1;
  itemForm.active = true;
  formErrors.time = "";
  formErrors.titleEn = "";
  activeLangTab.value = "en";
  isModalOpen.value = true;
};

const openEditModal = (item: FormattedScheduleItem) => {
  isEditing.value = true;
  currentEditingId.value = item.id;
  itemForm.time = item.time;
  itemForm.titleEn = item.title.en || "";
  itemForm.titleBn = item.title.bn || "";
  itemForm.descEn = item.description.en || "";
  itemForm.descBn = item.description.bn || "";
  itemForm.sortOrder = item.sortOrder;
  itemForm.active = item.active;
  formErrors.time = "";
  formErrors.titleEn = "";
  activeLangTab.value = "en";
  isModalOpen.value = true;
};

const validateForm = () => {
  let valid = true;
  formErrors.time = "";
  formErrors.titleEn = "";

  // Validate 24h HH:mm format
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!itemForm.time || !timeRegex.test(itemForm.time)) {
    formErrors.time = "Time must be in 24-hour HH:mm format (e.g. 05:00 or 18:30)";
    valid = false;
  }

  if (!itemForm.titleEn.trim()) {
    formErrors.titleEn = "English title is required";
    valid = false;
  }

  return valid;
};

const saveScheduleItem = async () => {
  if (!validateForm()) return;

  savingItem.value = true;
  try {
    if (isEditing.value && currentEditingId.value !== null) {
      // Update existing item
      await $trpc.schedule.update.mutate({
        id: currentEditingId.value,
        time: itemForm.time,
        title: { en: itemForm.titleEn.trim(), bn: itemForm.titleBn.trim() },
        description: { en: itemForm.descEn.trim(), bn: itemForm.descBn.trim() },
        sortOrder: itemForm.sortOrder,
        active: itemForm.active,
      });
      showToast("Ritual updated successfully!");
    } else {
      // Create new item
      await $trpc.schedule.create.mutate({
        time: itemForm.time,
        title: { en: itemForm.titleEn.trim(), bn: itemForm.titleBn.trim() },
        description: { en: itemForm.descEn.trim(), bn: itemForm.descBn.trim() },
        sortOrder: itemForm.sortOrder,
        active: itemForm.active,
      });
      showToast("New ritual added to schedule!");
    }

    isModalOpen.value = false;
    await fetchScheduleData();
  } catch (err: any) {
    console.error("Failed to save ritual:", err);
    showToast(err?.message || "Failed to save ritual", "error");
  } finally {
    savingItem.value = false;
  }
};

// Toggle active status directly
const toggleActiveStatus = async (item: FormattedScheduleItem) => {
  try {
    const nextState = !item.active;
    await $trpc.schedule.setActive.mutate({
      id: item.id,
      active: nextState,
    });
    item.active = nextState;
    showToast(`'${item.title.en}' is now ${nextState ? 'Active' : 'Hidden'}`);
    await fetchScheduleData();
  } catch (err: any) {
    showToast(err?.message || "Failed to toggle status", "error");
  }
};

// Reorder item up or down
const moveOrder = async (index: number, direction: "up" | "down") => {
  const target = direction === "up" ? index - 1 : index + 1;
  const list = [...filteredSchedule.value];
  if (target < 0 || target >= list.length) return;

  const current = list[index];
  const other = list[target];
  if (!current || !other) return;

  const tempOrder = current.sortOrder;
  current.sortOrder = other.sortOrder;
  other.sortOrder = tempOrder;

  try {
    await $trpc.schedule.reorder.mutate({
      items: [
        { id: current.id, sortOrder: current.sortOrder },
        { id: other.id, sortOrder: other.sortOrder },
      ],
    });
    showToast("Schedule reordered successfully!");
    await fetchScheduleData();
  } catch (err: any) {
    showToast(err?.message || "Failed to reorder", "error");
  }
};

// Delete confirmation
const deleteConfirmItem = ref<FormattedScheduleItem | null>(null);
const deletingItem = ref(false);

const confirmDelete = (item: FormattedScheduleItem) => {
  deleteConfirmItem.value = item;
};

const executeDelete = async () => {
  if (!deleteConfirmItem.value) return;

  deletingItem.value = true;
  try {
    await $trpc.schedule.delete.mutate({ id: deleteConfirmItem.value.id });
    showToast(`Deleted '${deleteConfirmItem.value.title.en}' successfully!`);
    deleteConfirmItem.value = null;
    await fetchScheduleData();
  } catch (err: any) {
    showToast(err?.message || "Failed to delete ritual", "error");
  } finally {
    deletingItem.value = false;
  }
};

// =========================================================================
// PUJAS & SACRED SERVICES STATE & METHODS
// =========================================================================
const pujaItems = ref<FormattedPujaItem[]>([]);
const loadingPujas = ref(false);
const pujaSearchQuery = ref("");
const pujaFilter = ref<"all" | "active" | "hidden" | "bookable">("all");

const fetchPujasData = async () => {
  loadingPujas.value = true;
  try {
    const res = await $trpc.pujas.list.query();
    if (res && res.items) {
      pujaItems.value = res.items;
    }
  } catch (err: any) {
    console.error("Failed to load pujas:", err);
    showToast(err?.message || "Failed to load pujas data", "error");
  } finally {
    loadingPujas.value = false;
  }
};

// Filtered pujas computed
const filteredPujas = computed(() => {
  return pujaItems.value.filter((item) => {
    // 1. Status / bookable filter
    if (pujaFilter.value === "active" && !item.active) return false;
    if (pujaFilter.value === "hidden" && item.active) return false;
    if (pujaFilter.value === "bookable" && !item.bookable) return false;

    // 2. Search query filter
    if (pujaSearchQuery.value.trim()) {
      const q = pujaSearchQuery.value.trim().toLowerCase();
      const matchSlug = item.slug.toLowerCase().includes(q);
      const matchNameEn = item.name.en.toLowerCase().includes(q);
      const matchNameBn = (item.name.bn || "").toLowerCase().includes(q);
      const matchDescEn = (item.description.en || "").toLowerCase().includes(q);
      const matchDescBn = (item.description.bn || "").toLowerCase().includes(q);
      const matchOfferedEn = (item.offered?.en || "").toLowerCase().includes(q);
      const matchOfferedBn = (item.offered?.bn || "").toLowerCase().includes(q);
      const matchPrice = String(item.priceBdt).includes(q);
      return (
        matchSlug ||
        matchNameEn ||
        matchNameBn ||
        matchDescEn ||
        matchDescBn ||
        matchOfferedEn ||
        matchOfferedBn ||
        matchPrice
      );
    }

    return true;
  });
});

// Stats computed
const totalPujasCount = computed(() => pujaItems.value.length);
const activePujasCount = computed(() => pujaItems.value.filter((p) => p.active).length);
const hiddenPujasCount = computed(() => pujaItems.value.filter((p) => !p.active).length);
const bookablePujasCount = computed(() => pujaItems.value.filter((p) => p.bookable).length);

// Modal state for Puja
const isPujaModalOpen = ref(false);
const isEditingPuja = ref(false);
const savingPuja = ref(false);
const currentEditingPujaId = ref<number | null>(null);
const activePujaLangTab = ref<"en" | "bn">("en");
const autoSlugEnabled = ref(true);

const pujaForm = reactive({
  slug: "",
  nameEn: "",
  nameBn: "",
  descEn: "",
  descBn: "",
  offeredEn: "",
  offeredBn: "",
  priceBdt: 501,
  duration: "45 minutes",
  bookable: true,
  sortOrder: 0,
  active: true,
});

const pujaFormErrors = reactive({
  slug: "",
  nameEn: "",
  descEn: "",
  priceBdt: "",
});

const pricePresets = [501, 1001, 1501, 2001, 2501, 5001];
const durationPresets = ["30 minutes", "45 minutes", "1 hour", "1.5 hours", "2 hours"];

const generateSlug = (val: string) => {
  return val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

const onPujaNameEnInput = () => {
  if (autoSlugEnabled.value && !isEditingPuja.value) {
    pujaForm.slug = generateSlug(pujaForm.nameEn);
  }
};

const onSlugManualEdit = () => {
  autoSlugEnabled.value = false;
};

const openAddPujaModal = () => {
  isEditingPuja.value = false;
  currentEditingPujaId.value = null;
  autoSlugEnabled.value = true;
  pujaForm.slug = "";
  pujaForm.nameEn = "";
  pujaForm.nameBn = "";
  pujaForm.descEn = "";
  pujaForm.descBn = "";
  pujaForm.offeredEn = "";
  pujaForm.offeredBn = "";
  pujaForm.priceBdt = 501;
  pujaForm.duration = "45 minutes";
  pujaForm.bookable = true;
  pujaForm.sortOrder = pujaItems.value.length + 1;
  pujaForm.active = true;
  pujaFormErrors.slug = "";
  pujaFormErrors.nameEn = "";
  pujaFormErrors.descEn = "";
  pujaFormErrors.priceBdt = "";
  activePujaLangTab.value = "en";
  isPujaModalOpen.value = true;
};

const openEditPujaModal = (item: FormattedPujaItem) => {
  isEditingPuja.value = true;
  currentEditingPujaId.value = item.id;
  autoSlugEnabled.value = false;
  pujaForm.slug = item.slug;
  pujaForm.nameEn = item.name.en || "";
  pujaForm.nameBn = item.name.bn || "";
  pujaForm.descEn = item.description.en || "";
  pujaForm.descBn = item.description.bn || "";
  pujaForm.offeredEn = item.offered?.en || "";
  pujaForm.offeredBn = item.offered?.bn || "";
  pujaForm.priceBdt = item.priceBdt;
  pujaForm.duration = item.duration || "";
  pujaForm.bookable = item.bookable;
  pujaForm.sortOrder = item.sortOrder;
  pujaForm.active = item.active;
  pujaFormErrors.slug = "";
  pujaFormErrors.nameEn = "";
  pujaFormErrors.descEn = "";
  pujaFormErrors.priceBdt = "";
  activePujaLangTab.value = "en";
  isPujaModalOpen.value = true;
};

const validatePujaForm = () => {
  let valid = true;
  pujaFormErrors.slug = "";
  pujaFormErrors.nameEn = "";
  pujaFormErrors.descEn = "";
  pujaFormErrors.priceBdt = "";

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!pujaForm.slug.trim()) {
    pujaFormErrors.slug = "Slug is required (e.g. nitya-puja)";
    valid = false;
  } else if (!slugRegex.test(pujaForm.slug.trim())) {
    pujaFormErrors.slug = "Slug must contain only lowercase letters, numbers, and hyphens";
    valid = false;
  }

  if (!pujaForm.nameEn.trim()) {
    pujaFormErrors.nameEn = "English puja name is required";
    valid = false;
  }

  if (!pujaForm.descEn.trim()) {
    pujaFormErrors.descEn = "English description is required";
    valid = false;
  }

  if (pujaForm.priceBdt < 0 || isNaN(pujaForm.priceBdt)) {
    pujaFormErrors.priceBdt = "Price in BDT must be 0 or a positive integer";
    valid = false;
  }

  return valid;
};

const savePujaItem = async () => {
  if (!validatePujaForm()) return;

  savingPuja.value = true;
  try {
    const inputPayload = {
      slug: pujaForm.slug.trim().toLowerCase(),
      name: { en: pujaForm.nameEn.trim(), bn: pujaForm.nameBn.trim() },
      description: { en: pujaForm.descEn.trim(), bn: pujaForm.descBn.trim() },
      offered:
        pujaForm.offeredEn.trim() || pujaForm.offeredBn.trim()
          ? { en: pujaForm.offeredEn.trim(), bn: pujaForm.offeredBn.trim() }
          : undefined,
      priceBdt: Math.round(pujaForm.priceBdt),
      duration: pujaForm.duration.trim() || undefined,
      bookable: pujaForm.bookable,
      sortOrder: pujaForm.sortOrder,
      active: pujaForm.active,
    };

    if (isEditingPuja.value && currentEditingPujaId.value !== null) {
      await $trpc.pujas.update.mutate({
        id: currentEditingPujaId.value,
        ...inputPayload,
      });
      showToast("Puja offering updated successfully!");
    } else {
      await $trpc.pujas.create.mutate(inputPayload);
      showToast("New puja offering created successfully!");
    }

    isPujaModalOpen.value = false;
    await fetchPujasData();
  } catch (err: any) {
    console.error("Failed to save puja:", err);
    showToast(err?.message || "Failed to save puja offering", "error");
  } finally {
    savingPuja.value = false;
  }
};

const togglePujaActiveStatus = async (item: FormattedPujaItem) => {
  try {
    const nextState = !item.active;
    await $trpc.pujas.setActive.mutate({
      id: item.id,
      active: nextState,
    });
    item.active = nextState;
    showToast(`'${item.name.en}' is now ${nextState ? 'Active' : 'Hidden'}`);
    await fetchPujasData();
  } catch (err: any) {
    showToast(err?.message || "Failed to toggle status", "error");
  }
};

const togglePujaBookableStatus = async (item: FormattedPujaItem) => {
  try {
    const nextState = !item.bookable;
    await $trpc.pujas.setBookable.mutate({
      id: item.id,
      bookable: nextState,
    });
    item.bookable = nextState;
    showToast(`'${item.name.en}' booking is now ${nextState ? 'Enabled' : 'Disabled'}`);
    await fetchPujasData();
  } catch (err: any) {
    showToast(err?.message || "Failed to toggle booking", "error");
  }
};

const movePujaOrder = async (index: number, direction: "up" | "down") => {
  const target = direction === "up" ? index - 1 : index + 1;
  const list = [...filteredPujas.value];
  if (target < 0 || target >= list.length) return;

  const current = list[index];
  const other = list[target];
  if (!current || !other) return;

  const tempOrder = current.sortOrder;
  current.sortOrder = other.sortOrder;
  other.sortOrder = tempOrder;

  try {
    await $trpc.pujas.reorder.mutate({
      items: [
        { id: current.id, sortOrder: current.sortOrder },
        { id: other.id, sortOrder: other.sortOrder },
      ],
    });
    showToast("Pujas reordered successfully!");
    await fetchPujasData();
  } catch (err: any) {
    showToast(err?.message || "Failed to reorder", "error");
  }
};

const deleteConfirmPuja = ref<FormattedPujaItem | null>(null);
const deletingPuja = ref(false);

const confirmDeletePuja = (item: FormattedPujaItem) => {
  deleteConfirmPuja.value = item;
};

const executeDeletePuja = async () => {
  if (!deleteConfirmPuja.value) return;

  deletingPuja.value = true;
  try {
    await $trpc.pujas.delete.mutate({ id: deleteConfirmPuja.value.id });
    showToast(`Deleted '${deleteConfirmPuja.value.name.en}' successfully!`);
    deleteConfirmPuja.value = null;
    await fetchPujasData();
  } catch (err: any) {
    showToast(err?.message || "Failed to delete puja", "error");
  } finally {
    deletingPuja.value = false;
  }
};
</script>

<template>
  <div class="admin-layout">
    <!-- TOAST NOTIFICATION -->
    <transition name="toast-fade">
      <div v-if="toast.show" class="admin-toast" :class="`toast-${toast.type}`">
        <span class="toast-icon">
          {{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ' }}
        </span>
        <span class="toast-msg">{{ toast.message }}</span>
      </div>
    </transition>

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
            <span class="brand-title">SANCTUM</span>
            <span class="brand-tag">{{ isAdmin ? 'Super Admin' : 'Content Editor' }}</span>
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
        <div class="nav-group-title">Console Navigation</div>
        <ul class="nav-list">
          <li v-for="item in navItems" :key="item.id">
            <button
              type="button"
              class="nav-item-btn"
              :class="{ 'item-active': activeModule === item.id }"
              @click="activeModule = item.id as any; isSidebarOpen = false"
            >
              <span class="item-icon">{{ item.icon }}</span>
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
            <span class="crumb-active">
              {{ activeModule === 'dashboard' ? 'Overview Dashboard' : 'Daily Schedule' }}
            </span>
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
        <!-- =============================================================== -->
        <!-- TAB 1: OVERVIEW DASHBOARD                                       -->
        <!-- =============================================================== -->
        <div v-if="activeModule === 'dashboard'" class="tab-pane">
          <!-- Welcome Greeting Banner -->
          <div class="welcome-banner">
            <div class="welcome-text">
              <span class="welcome-badge">MANDIR CONSOLE</span>
              <h1 class="welcome-heading">Welcome, {{ currentUser?.name || 'Administrator' }}</h1>
              <p class="welcome-sub">{{ formattedDate }} • Golpahar Mohashoshan Kali Mandir Portal</p>
            </div>
          </div>

          <!-- KPI Grid -->
          <div class="kpi-grid">
            <div class="kpi-card" @click="activeModule = 'schedule'">
              <div class="kpi-icon-wrap gold-icon">🔔</div>
              <div class="kpi-content">
                <span class="kpi-label">Daily Aartis & Pujas</span>
                <span class="kpi-val">{{ totalRitualsCount }}</span>
                <span class="kpi-trend">
                  <span class="trend-up">{{ activeRitualsCount }} Active</span> • {{ hiddenRitualsCount }} Hidden
                </span>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon-wrap blue-icon">⏱️</div>
              <div class="kpi-content">
                <span class="kpi-label">Dhaka Time & Next Aarti</span>
                <span class="kpi-val text-sm font-bold text-accent">
                  {{ nextAartiInfo ? nextAartiInfo.item.title.en : 'Computing...' }}
                </span>
                <span class="kpi-trend">
                  {{ nextAartiInfo ? `${nextAartiInfo.item.time} (${nextAartiInfo.isTomorrow ? 'Tomorrow' : 'Today'})` : 'Synchronized' }}
                </span>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon-wrap green-icon">🛡️</div>
              <div class="kpi-content">
                <span class="kpi-label">Backend Architecture</span>
                <span class="kpi-val">D1 + R2</span>
                <span class="kpi-trend text-green-400">tRPC & Cache Active</span>
              </div>
            </div>
          </div>

          <!-- Quick Navigation Panel -->
          <div class="dash-panel">
            <div class="panel-head">
              <h2 class="panel-title">Sanctum Operations</h2>
              <span class="panel-tag">Quick Actions</span>
            </div>
            <div class="quick-actions-grid">
              <button type="button" class="action-btn" @click="activeModule = 'schedule'">
                <span class="action-btn-icon">🔔</span>
                <span>Manage Daily Schedule</span>
              </button>
              <button type="button" class="action-btn" @click="openAddModal">
                <span class="action-btn-icon">➕</span>
                <span>Add New Daily Ritual</span>
              </button>
            </div>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- TAB 2: DAILY SCHEDULE CRUD MANAGER                              -->
        <!-- =============================================================== -->
        <div v-else-if="activeModule === 'schedule'" class="tab-pane">
          <!-- Module Header -->
          <div class="module-header-row">
            <div>
              <h1 class="module-title">Daily Aarti & Puja Schedule</h1>
              <p class="module-subtitle">
                Manage sacred ritual timings. The Next Aarti badge on the public home page is dynamically calculated from these entries.
              </p>
            </div>
            <div class="module-header-actions">
              <button type="button" class="btn-refresh" @click="fetchScheduleData" title="Refresh schedule">
                ↻ Refresh
              </button>
              <button type="button" class="btn-add-primary" @click="openAddModal">
                <span>+ Add Aarti / Ritual</span>
              </button>
            </div>
          </div>

          <!-- Live Next Aarti Banner -->
          <div v-if="nextAartiInfo" class="next-aarti-banner">
            <div class="aarti-banner-left">
              <span class="aarti-live-dot"></span>
              <div>
                <span class="aarti-banner-tag">NEXT UPCOMING AARTI</span>
                <h3 class="aarti-banner-title">
                  {{ nextAartiInfo.item.title.en }}
                  <span class="aarti-time-chip">{{ nextAartiInfo.item.time }}</span>
                </h3>
              </div>
            </div>
            <div class="aarti-banner-right">
              <span class="aarti-badge-day" :class="nextAartiInfo.isTomorrow ? 'badge-tomorrow' : 'badge-today'">
                {{ nextAartiInfo.isTomorrow ? 'Scheduled for Tomorrow' : 'Today in Chittagong' }}
              </span>
              <span class="aarti-dhaka-clock">Dhaka Time: {{ nextAartiInfo.timeInDhaka }}</span>
            </div>
          </div>

          <!-- Search & Filter Controls -->
          <div class="filters-bar">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                v-model="searchQuery"
                class="search-input"
                placeholder="Search rituals by time, title, or description..."
              />
              <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">&times;</button>
            </div>

            <div class="filter-pills">
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': statusFilter === 'all' }"
                @click="statusFilter = 'all'"
              >
                All ({{ totalRitualsCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': statusFilter === 'active' }"
                @click="statusFilter = 'active'"
              >
                Active ({{ activeRitualsCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': statusFilter === 'hidden' }"
                @click="statusFilter = 'hidden'"
              >
                Hidden ({{ hiddenRitualsCount }})
              </button>
            </div>
          </div>

          <!-- Schedule Table / Card List -->
          <div class="schedule-table-card">
            <div v-if="loadingSchedule" class="loading-state">
              <div class="spinner"></div>
              <span>Loading daily rituals from Sanctum database...</span>
            </div>

            <div v-else-if="filteredSchedule.length === 0" class="empty-state">
              <span class="empty-icon">🪔</span>
              <h3 class="empty-title">No rituals found</h3>
              <p class="empty-desc">
                {{ searchQuery ? 'No rituals match your search filter.' : 'No daily schedule items have been added yet.' }}
              </p>
              <button type="button" class="btn-add-primary" @click="openAddModal">
                <span>+ Add First Ritual</span>
              </button>
            </div>

            <div v-else class="ritual-items-list">
              <div
                v-for="(item, idx) in filteredSchedule"
                :key="item.id"
                class="schedule-row-item"
                :class="{ 'item-inactive': !item.active }"
              >
                <!-- Reorder Controls -->
                <div class="reorder-col">
                  <button
                    type="button"
                    class="btn-reorder"
                    :disabled="idx === 0"
                    title="Move earlier"
                    @click="moveOrder(idx, 'up')"
                  >
                    ▲
                  </button>
                  <span class="sort-order-num">{{ item.sortOrder }}</span>
                  <button
                    type="button"
                    class="btn-reorder"
                    :disabled="idx === filteredSchedule.length - 1"
                    title="Move later"
                    @click="moveOrder(idx, 'down')"
                  >
                    ▼
                  </button>
                </div>

                <!-- Time Pill -->
                <div class="time-col">
                  <div class="ritual-time-badge">
                    <span class="clock-icon">🕒</span>
                    <span class="time-text">{{ item.time }}</span>
                  </div>
                </div>

                <!-- Ritual Details (Bilingual) -->
                <div class="details-col">
                  <div class="title-row">
                    <h3 class="ritual-title-en">{{ item.title.en }}</h3>
                    <span v-if="item.title.bn" class="ritual-title-bn">{{ item.title.bn }}</span>
                  </div>
                  <p class="ritual-desc-en">{{ item.description.en || 'No English description provided.' }}</p>
                  <p v-if="item.description.bn" class="ritual-desc-bn">{{ item.description.bn }}</p>
                </div>

                <!-- Active Toggle -->
                <div class="toggle-col">
                  <label class="switch-toggle" :title="item.active ? 'Click to hide from public' : 'Click to make active'">
                    <input
                      type="checkbox"
                      :checked="item.active"
                      @change="toggleActiveStatus(item)"
                    />
                    <span class="switch-slider round"></span>
                  </label>
                  <span class="status-caption" :class="item.active ? 'caption-active' : 'caption-hidden'">
                    {{ item.active ? 'Active' : 'Hidden' }}
                  </span>
                </div>

                <!-- Action Buttons -->
                <div class="actions-col">
                  <button
                    type="button"
                    class="btn-action-edit"
                    title="Edit ritual"
                    @click="openEditModal(item)"
                  >
                    <span>✏️ Edit</span>
                  </button>
                  <button
                    type="button"
                    class="btn-action-del"
                    title="Delete ritual"
                    @click="confirmDelete(item)"
                  >
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- TAB 3: PUJAS & SERVICES CRUD MANAGER                           -->
        <!-- =============================================================== -->
        <div v-else-if="activeModule === 'pujas'" class="tab-pane">
          <!-- Module Header -->
          <div class="module-header-row">
            <div>
              <h1 class="module-title">Pujas & Sacred Services</h1>
              <p class="module-subtitle">
                Configure temple puja offerings, suggested dakshina/charges, duration, samagri inclusions, and devotee booking settings.
              </p>
            </div>
            <div class="module-header-actions">
              <button type="button" class="btn-refresh" @click="fetchPujasData" title="Refresh pujas list">
                ↻ Refresh
              </button>
              <button type="button" class="btn-add-primary" @click="openAddPujaModal">
                <span>+ Add Puja Offering</span>
              </button>
            </div>
          </div>

          <!-- Filters Bar -->
          <div class="filters-bar">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                v-model="pujaSearchQuery"
                class="search-input"
                placeholder="Search pujas by title, slug, samagri, or description..."
              />
              <button v-if="pujaSearchQuery" class="clear-search-btn" @click="pujaSearchQuery = ''">&times;</button>
            </div>

            <div class="filter-pills">
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': pujaFilter === 'all' }"
                @click="pujaFilter = 'all'"
              >
                All ({{ totalPujasCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': pujaFilter === 'active' }"
                @click="pujaFilter = 'active'"
              >
                Active ({{ activePujasCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': pujaFilter === 'hidden' }"
                @click="pujaFilter = 'hidden'"
              >
                Hidden ({{ hiddenPujasCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': pujaFilter === 'bookable' }"
                @click="pujaFilter = 'bookable'"
              >
                Bookable ({{ bookablePujasCount }})
              </button>
            </div>
          </div>

          <!-- Pujas Table / Card List -->
          <div class="schedule-table-card">
            <div v-if="loadingPujas" class="loading-state">
              <div class="spinner"></div>
              <span>Loading sacred puja offerings from Sanctum database...</span>
            </div>

            <div v-else-if="filteredPujas.length === 0" class="empty-state">
              <span class="empty-icon">🪔</span>
              <h3 class="empty-title">No puja offerings found</h3>
              <p class="empty-desc">
                {{ pujaSearchQuery ? 'No pujas match your search filter.' : 'No puja offerings have been configured in Sanctum yet.' }}
              </p>
              <button type="button" class="btn-add-primary" @click="openAddPujaModal">
                <span>+ Add First Puja Offering</span>
              </button>
            </div>

            <div v-else class="puja-items-list">
              <div
                v-for="(item, idx) in filteredPujas"
                :key="item.id"
                class="puja-row-item"
                :class="{ 'item-inactive': !item.active }"
              >
                <!-- Reorder Controls -->
                <div class="reorder-col">
                  <button
                    type="button"
                    class="btn-reorder"
                    :disabled="idx === 0"
                    title="Move higher"
                    @click="movePujaOrder(idx, 'up')"
                  >
                    ▲
                  </button>
                  <span class="sort-order-num">{{ item.sortOrder }}</span>
                  <button
                    type="button"
                    class="btn-reorder"
                    :disabled="idx === filteredPujas.length - 1"
                    title="Move lower"
                    @click="movePujaOrder(idx, 'down')"
                  >
                    ▼
                  </button>
                </div>

                <!-- Price & Duration Meta Pill -->
                <div class="puja-meta-badge-col">
                  <div class="puja-price-badge">
                    <span class="currency-sym">৳</span>
                    <span class="price-val">{{ item.priceBdt.toLocaleString() }}</span>
                  </div>
                  <div class="puja-duration-pill">
                    <span>⏱️</span>
                    <span>{{ item.duration || 'Flexible' }}</span>
                  </div>
                </div>

                <!-- Puja Details Column -->
                <div class="puja-details-col">
                  <div class="title-row">
                    <h3 class="puja-title-en">{{ item.name.en }}</h3>
                    <span v-if="item.name.bn" class="puja-title-bn">{{ item.name.bn }}</span>
                    <span class="puja-slug-pill">/{{ item.slug }}</span>
                  </div>
                  <p class="puja-desc-en">{{ item.description.en }}</p>
                  <p v-if="item.description.bn" class="puja-desc-bn">{{ item.description.bn }}</p>

                  <!-- Samagri / Offered Items Box -->
                  <div v-if="item.offered?.en || item.offered?.bn" class="puja-offered-box">
                    <span class="offered-icon">🌸</span>
                    <div class="offered-content">
                      <span class="offered-label">Included Samagri:</span>
                      <span class="offered-text">{{ item.offered?.en }}</span>
                      <span v-if="item.offered?.bn" class="offered-text-bn">({{ item.offered?.bn }})</span>
                    </div>
                  </div>
                </div>

                <!-- Dual Toggles: Bookable & Active -->
                <div class="puja-toggles-col">
                  <!-- Bookable toggle -->
                  <div class="mini-toggle-group">
                    <span class="mini-toggle-title">Online Booking</span>
                    <div class="mini-toggle-row">
                      <label class="switch-toggle" :title="item.bookable ? 'Click to disable online booking' : 'Click to enable online booking'">
                        <input
                          type="checkbox"
                          :checked="item.bookable"
                          @change="togglePujaBookableStatus(item)"
                        />
                        <span class="switch-slider round switch-slider-blue"></span>
                      </label>
                      <span class="status-caption" :class="item.bookable ? 'caption-bookable' : 'caption-hidden'">
                        {{ item.bookable ? 'Enabled' : 'Disabled' }}
                      </span>
                    </div>
                  </div>

                  <!-- Active toggle -->
                  <div class="mini-toggle-group">
                    <span class="mini-toggle-title">Portal Visibility</span>
                    <div class="mini-toggle-row">
                      <label class="switch-toggle" :title="item.active ? 'Click to hide from public' : 'Click to make active'">
                        <input
                          type="checkbox"
                          :checked="item.active"
                          @change="togglePujaActiveStatus(item)"
                        />
                        <span class="switch-slider round"></span>
                      </label>
                      <span class="status-caption" :class="item.active ? 'caption-active' : 'caption-hidden'">
                        {{ item.active ? 'Active' : 'Hidden' }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="actions-col">
                  <button
                    type="button"
                    class="btn-action-edit"
                    title="Edit puja details"
                    @click="openEditPujaModal(item)"
                  >
                    <span>✏️ Edit</span>
                  </button>
                  <button
                    type="button"
                    class="btn-action-del"
                    title="Delete puja offering"
                    @click="confirmDeletePuja(item)"
                  >
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- =================================================================== -->
    <!-- ADD / EDIT RITUAL MODAL DIALOG                                      -->
    <!-- =================================================================== -->
    <div v-if="isModalOpen" class="modal-backdrop" @click.self="isModalOpen = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="modal-tag">{{ isEditing ? 'EDIT RITUAL' : 'NEW RITUAL' }}</span>
            <h2 class="modal-title">{{ isEditing ? 'Edit Daily Aarti / Ritual' : 'Add New Aarti / Ritual' }}</h2>
          </div>
          <button type="button" class="modal-close-btn" @click="isModalOpen = false">&times;</button>
        </div>

        <form @submit.prevent="saveScheduleItem" class="modal-form">
          <div class="modal-body">
            <!-- 1. TIME PICKER & PRESETS -->
            <div class="form-group">
              <label class="form-label">
                Ritual Timing (24-Hour HH:mm) <span class="required-star">*</span>
              </label>
              <div class="time-input-wrap">
                <input
                  type="text"
                  v-model="itemForm.time"
                  class="form-input font-mono"
                  placeholder="e.g. 05:00 or 18:30"
                  maxlength="5"
                />
              </div>
              <span v-if="formErrors.time" class="error-msg">{{ formErrors.time }}</span>

              <!-- Quick Time Preset Chips -->
              <div class="time-presets-row">
                <span class="preset-label">Quick Presets:</span>
                <button
                  v-for="preset in timePresets"
                  :key="preset"
                  type="button"
                  class="preset-chip"
                  @click="itemForm.time = preset; formErrors.time = ''"
                >
                  {{ preset }}
                </button>
              </div>
            </div>

            <!-- 2. BILINGUAL CONTENT TABS -->
            <div class="lang-tabs-nav">
              <button
                type="button"
                class="lang-tab-pill"
                :class="{ 'lang-tab-active': activeLangTab === 'en' }"
                @click="activeLangTab = 'en'"
              >
                <span>English</span>
                <span class="lang-req-dot" title="Required">*</span>
              </button>
              <button
                type="button"
                class="lang-tab-pill"
                :class="{ 'lang-tab-active': activeLangTab === 'bn' }"
                @click="activeLangTab = 'bn'"
              >
                <span>বাংলা (Bengali)</span>
                <span class="lang-opt-badge">Optional</span>
              </button>
            </div>

            <!-- English Fields -->
            <div v-show="activeLangTab === 'en'" class="lang-fields-box">
              <div class="form-group">
                <label class="form-label">Ritual Title (English) <span class="required-star">*</span></label>
                <input
                  type="text"
                  v-model="itemForm.titleEn"
                  class="form-input"
                  placeholder="e.g. Mangala Aarti, Bhog Offering, Sandhya Aarti"
                />
                <span v-if="formErrors.titleEn" class="error-msg">{{ formErrors.titleEn }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">Description (English)</label>
                <textarea
                  v-model="itemForm.descEn"
                  class="form-textarea"
                  rows="3"
                  placeholder="Brief description of the ritual offering, bells, or darshan..."
                ></textarea>
              </div>
            </div>

            <!-- Bengali Fields -->
            <div v-show="activeLangTab === 'bn'" class="lang-fields-box">
              <div class="form-group">
                <label class="form-label">Ritual Title (বাংলা)</label>
                <input
                  type="text"
                  v-model="itemForm.titleBn"
                  class="form-input"
                  placeholder="যেমন: মঙ্গলারতি, ভোগ আরতি, সন্ধ্যারতি"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Description (বাংলা)</label>
                <textarea
                  v-model="itemForm.descBn"
                  class="form-textarea"
                  rows="3"
                  placeholder="পূজা ও আরতির বর্ণনা..."
                ></textarea>
              </div>
            </div>

            <!-- 3. SORT ORDER & ACTIVE STATUS -->
            <div class="form-row-2">
              <div class="form-group flex-1">
                <label class="form-label">Display Order</label>
                <input
                  type="number"
                  v-model.number="itemForm.sortOrder"
                  class="form-input"
                  min="0"
                />
                <span class="hint-text">Lower numbers appear first in the schedule flow</span>
              </div>

              <div class="form-group flex-1 checkbox-group">
                <label class="form-label">Visibility Status</label>
                <label class="checkbox-container">
                  <input type="checkbox" v-model="itemForm.active" />
                  <span class="checkbox-label-text">
                    {{ itemForm.active ? 'Active (Visible on public portal)' : 'Hidden (Draft only)' }}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="isModalOpen = false">Cancel</button>
            <button type="submit" class="btn-save" :disabled="savingItem">
              <span>{{ savingItem ? 'Saving...' : isEditing ? 'Update Ritual' : 'Save Ritual' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- DELETE CONFIRMATION MODAL                                           -->
    <!-- =================================================================== -->
    <div v-if="deleteConfirmItem" class="modal-backdrop" @click.self="deleteConfirmItem = null">
      <div class="modal-dialog modal-dialog-sm">
        <div class="modal-header">
          <h2 class="modal-title text-red-500">Confirm Deletion</h2>
          <button type="button" class="modal-close-btn" @click="deleteConfirmItem = null">&times;</button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">
            Are you sure you want to delete <strong>{{ deleteConfirmItem.title.en }}</strong> ({{ deleteConfirmItem.time }})?
          </p>
          <p class="confirm-warning">
            This will permanently remove this ritual from the temple daily schedule and audit logs will be updated.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="deleteConfirmItem = null">Cancel</button>
          <button
            type="button"
            class="btn-delete-confirm"
            :disabled="deletingItem"
            @click="executeDelete"
          >
            <span>{{ deletingItem ? 'Deleting...' : 'Yes, Delete' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- ADD / EDIT PUJA MODAL DIALOG                                        -->
    <!-- =================================================================== -->
    <div v-if="isPujaModalOpen" class="modal-backdrop" @click.self="isPujaModalOpen = false">
      <div class="modal-dialog modal-dialog-lg">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="modal-tag">{{ isEditingPuja ? 'EDIT PUJA' : 'NEW PUJA OFFERING' }}</span>
            <h2 class="modal-title">{{ isEditingPuja ? 'Edit Puja Offering & Charges' : 'Add New Puja Offering' }}</h2>
          </div>
          <button type="button" class="modal-close-btn" @click="isPujaModalOpen = false">&times;</button>
        </div>

        <form @submit.prevent="savePujaItem" class="modal-form">
          <div class="modal-body">
            <!-- 1. SLUG, PRICE & DURATION ROW -->
            <div class="form-row-3">
              <!-- Slug -->
              <div class="form-group flex-1">
                <label class="form-label">
                  URL Slug <span class="required-star">*</span>
                </label>
                <div class="input-with-prefix">
                  <span class="input-prefix">/</span>
                  <input
                    type="text"
                    v-model="pujaForm.slug"
                    class="form-input font-mono"
                    placeholder="satyanarayan-puja"
                    @input="onSlugManualEdit"
                  />
                </div>
                <span v-if="pujaFormErrors.slug" class="error-msg">{{ pujaFormErrors.slug }}</span>
                <span class="hint-text">Unique URL identifier (lowercase letters & hyphens)</span>
              </div>

              <!-- Price in BDT -->
              <div class="form-group flex-1">
                <label class="form-label">
                  Dakshina / Price (BDT) <span class="required-star">*</span>
                </label>
                <div class="input-with-prefix">
                  <span class="input-prefix">৳</span>
                  <input
                    type="number"
                    v-model.number="pujaForm.priceBdt"
                    class="form-input font-mono"
                    placeholder="501"
                    min="0"
                  />
                </div>
                <span v-if="pujaFormErrors.priceBdt" class="error-msg">{{ pujaFormErrors.priceBdt }}</span>
                <!-- Price Presets -->
                <div class="chip-presets-row">
                  <button
                    v-for="preset in pricePresets"
                    :key="preset"
                    type="button"
                    class="preset-chip"
                    @click="pujaForm.priceBdt = preset; pujaFormErrors.priceBdt = ''"
                  >
                    ৳{{ preset }}
                  </button>
                </div>
              </div>

              <!-- Duration -->
              <div class="form-group flex-1">
                <label class="form-label">Estimated Duration</label>
                <input
                  type="text"
                  v-model="pujaForm.duration"
                  class="form-input"
                  placeholder="e.g. 45 minutes, 2 hours"
                />
                <!-- Duration Presets -->
                <div class="chip-presets-row">
                  <button
                    v-for="preset in durationPresets"
                    :key="preset"
                    type="button"
                    class="preset-chip"
                    @click="pujaForm.duration = preset"
                  >
                    {{ preset }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 2. BILINGUAL CONTENT TABS -->
            <div class="lang-tab-bar">
              <button
                type="button"
                class="lang-tab-btn"
                :class="{ 'lang-tab-active': activePujaLangTab === 'en' }"
                @click="activePujaLangTab = 'en'"
              >
                <span>English Content</span>
                <span class="lang-req-dot">• Required</span>
              </button>
              <button
                type="button"
                class="lang-tab-btn"
                :class="{ 'lang-tab-active': activePujaLangTab === 'bn' }"
                @click="activePujaLangTab = 'bn'"
              >
                <span>বাংলা বিবরণ</span>
                <span class="lang-opt-badge">(ঐচ্ছিক)</span>
              </button>
            </div>

            <!-- English Fields -->
            <div v-show="activePujaLangTab === 'en'" class="lang-fields-box">
              <div class="form-group">
                <label class="form-label">
                  Puja Name (English) <span class="required-star">*</span>
                </label>
                <input
                  type="text"
                  v-model="pujaForm.nameEn"
                  class="form-input"
                  placeholder="e.g. Nitya Puja, Satyanarayan Puja, Rudrabhishek"
                  @input="onPujaNameEnInput"
                />
                <span v-if="pujaFormErrors.nameEn" class="error-msg">{{ pujaFormErrors.nameEn }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">
                  Description & Spiritual Significance (English) <span class="required-star">*</span>
                </label>
                <textarea
                  v-model="pujaForm.descEn"
                  class="form-textarea"
                  rows="3"
                  placeholder="The daily worship, offered on your behalf with your name and gotra read in the sankalpa..."
                ></textarea>
                <span v-if="pujaFormErrors.descEn" class="error-msg">{{ pujaFormErrors.descEn }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">Included Samagri / Offerings (English)</label>
                <input
                  type="text"
                  v-model="pujaForm.offeredEn"
                  class="form-input"
                  placeholder="e.g. Flowers, bel patra, incense, bhog and prasad"
                />
                <span class="hint-text">List of items and sacred offerings provided by the temple for this puja</span>
              </div>
            </div>

            <!-- Bengali Fields -->
            <div v-show="activePujaLangTab === 'bn'" class="lang-fields-box">
              <div class="form-group">
                <label class="form-label">পূজার নাম (বাংলা)</label>
                <input
                  type="text"
                  v-model="pujaForm.nameBn"
                  class="form-input"
                  placeholder="যেমন: নিত্য পূজা, সত্যনারায়ণ পূজা, রুদ্রাভিষেক"
                />
              </div>

              <div class="form-group">
                <label class="form-label">পূজার মাহাত্ম্য ও বিবরণ (বাংলা)</label>
                <textarea
                  v-model="pujaForm.descBn"
                  class="form-textarea"
                  rows="3"
                  placeholder="ভক্তের নাম ও গোত্রে সংকল্পপূর্বক মন্দিরের পুরোহিত দ্বারা অর্পিত..."
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">প্রদত্ত সামগ্রী ও উপাচার (বাংলা)</label>
                <input
                  type="text"
                  v-model="pujaForm.offeredBn"
                  class="form-input"
                  placeholder="যেমন: ফুল, বেলপাতা, চন্দন, ভোগ ও গৃহের প্রসাদ"
                />
              </div>
            </div>

            <!-- 3. SORT ORDER, BOOKABLE & ACTIVE SWITCHES -->
            <div class="form-row-3 align-center">
              <div class="form-group flex-1">
                <label class="form-label">Display Order</label>
                <input
                  type="number"
                  v-model.number="pujaForm.sortOrder"
                  class="form-input"
                  min="0"
                />
                <span class="hint-text">Order in which this puja appears on the list</span>
              </div>

              <div class="form-group flex-1 checkbox-group">
                <label class="form-label">Online Booking</label>
                <label class="checkbox-container">
                  <input type="checkbox" v-model="pujaForm.bookable" />
                  <span class="checkbox-label-text">
                    {{ pujaForm.bookable ? 'Allow Online Booking' : 'Walk-in / Office Only' }}
                  </span>
                </label>
              </div>

              <div class="form-group flex-1 checkbox-group">
                <label class="form-label">Public Visibility</label>
                <label class="checkbox-container">
                  <input type="checkbox" v-model="pujaForm.active" />
                  <span class="checkbox-label-text">
                    {{ pujaForm.active ? 'Active (Live on Portal)' : 'Hidden (Draft Only)' }}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="isPujaModalOpen = false">Cancel</button>
            <button type="submit" class="btn-save" :disabled="savingPuja">
              <span>{{ savingPuja ? 'Saving...' : isEditingPuja ? 'Update Puja' : 'Create Puja' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- DELETE PUJA CONFIRMATION MODAL                                      -->
    <!-- =================================================================== -->
    <div v-if="deleteConfirmPuja" class="modal-backdrop" @click.self="deleteConfirmPuja = null">
      <div class="modal-dialog modal-dialog-sm">
        <div class="modal-header">
          <h2 class="modal-title text-red-500">Confirm Puja Deletion</h2>
          <button type="button" class="modal-close-btn" @click="deleteConfirmPuja = null">&times;</button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">
            Are you sure you want to delete <strong>{{ deleteConfirmPuja.name.en }}</strong> (৳{{ deleteConfirmPuja.priceBdt }})?
          </p>
          <p class="confirm-warning">
            This will permanently remove this puja from public listings. Any existing booking records will be retained with their details intact.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="deleteConfirmPuja = null">Cancel</button>
          <button
            type="button"
            class="btn-delete-confirm"
            :disabled="deletingPuja"
            @click="executeDeletePuja"
          >
            <span>{{ deletingPuja ? 'Deleting...' : 'Yes, Delete Puja' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ====================================================
   BASE LAYOUT
   ==================================================== */
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  position: relative;
  font-family: inherit;
}

/* Toast */
.admin-toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1.25rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 700;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

.toast-success { background: #15803d; color: #fff; }
.toast-error { background: #b91c1c; color: #fff; }
.toast-info { background: #1d4ed8; color: #fff; }

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Sidebar */
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
  .admin-sidebar { transform: translateX(-100%); }
  .admin-sidebar.sidebar-open { transform: translateX(0); }
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

.logo-mark { width: 32px; height: 32px; }
.temple-svg-icon { width: 100%; height: 100%; }

.logo-text { display: flex; flex-direction: column; }
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
  .mobile-close-btn { display: block; }
}

.sidebar-nav {
  flex: 1;
  padding: 1.5rem 1rem;
  overflow-y: auto;
}

.nav-group-title {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: 0 0.85rem 0.5rem;
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

.item-icon { font-size: 1.1rem; }
.item-label { flex: 1; }
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
  color: #160B0C;
}

/* User footer in sidebar */
.sidebar-user-footer {
  padding: 1.25rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-info { display: flex; align-items: center; gap: 0.75rem; }
.user-details { display: flex; flex-direction: column; }
.user-name { font-size: 0.875rem; font-weight: 700; color: var(--text-primary); }
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
.role-admin { background: rgba(245, 158, 11, 0.15); color: var(--accent); border: 1px solid rgba(245, 158, 11, 0.3); }
.role-editor { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }

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
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.logout-icon { width: 16px; height: 16px; }

/* Main Wrapper */
.admin-main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 280px;
  min-width: 0;
}

@media (max-width: 1024px) {
  .admin-main-wrapper { margin-left: 0; }
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

.topbar-left { display: flex; align-items: center; gap: 1rem; }
.hamburger-btn {
  display: none;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 0.25rem;
}
.hamburger-btn svg { width: 22px; height: 22px; }

@media (max-width: 1024px) {
  .hamburger-btn { display: block; }
}

.breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
.crumb-root { color: var(--text-muted); }
.crumb-sep { color: var(--text-muted); opacity: 0.5; }
.crumb-active { font-weight: 700; color: var(--text-primary); }

.topbar-right { display: flex; align-items: center; gap: 1rem; }

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

.btn-live-site:hover { color: var(--accent); border-color: var(--accent); }
.link-arrow { width: 14px; height: 14px; }

/* Dashboard Body */
.dashboard-body {
  padding: 2.25rem 2rem 4rem;
  max-width: 1300px;
  width: 100%;
}

.welcome-banner { margin-bottom: 2.25rem; }
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

.welcome-sub { font-size: 0.925rem; color: var(--text-secondary); }

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
  cursor: pointer;
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

.gold-icon { background: var(--accent-glow); border: 1px solid rgba(245, 158, 11, 0.3); }
.blue-icon { background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.3); }
.green-icon { background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.3); }

.kpi-content { display: flex; flex-direction: column; }
.kpi-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.25rem; }
.kpi-val { font-size: 1.45rem; font-weight: 800; color: var(--text-primary); line-height: 1.1; margin-bottom: 0.35rem; }
.kpi-trend { font-size: 0.775rem; color: var(--text-muted); }
.trend-up { color: #22c55e; font-weight: 700; }

.dash-panel {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 1.75rem;
}

.panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
.panel-title { font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0; }
.panel-tag { font-size: 0.75rem; font-weight: 700; color: var(--accent); background: var(--accent-glow); padding: 0.25rem 0.65rem; border-radius: 9999px; }

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  border-color: var(--accent);
  background: var(--accent-glow);
  transform: translateY(-2px);
}

.action-btn-icon { font-size: 1.6rem; }

/* ====================================================
   DAILY SCHEDULE CRUD MODULE STYLES
   ==================================================== */
.module-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.module-title {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 0.35rem;
}

.module-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  max-width: 650px;
  line-height: 1.5;
}

.module-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn-refresh {
  padding: 0.65rem 1rem;
  border-radius: 8px;
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-refresh:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-add-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  background: var(--accent);
  color: #160B0C;
  font-size: 0.875rem;
  font-weight: 800;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(224, 165, 38, 0.25);
  transition: all 0.15s ease;
}

.btn-add-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

/* Next Aarti Banner */
.next-aarti-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 14px;
  background: linear-gradient(90deg, rgba(224, 165, 38, 0.12) 0%, rgba(153, 27, 27, 0.15) 100%);
  border: 1px solid rgba(224, 165, 38, 0.3);
  margin-bottom: 1.5rem;
}

.aarti-banner-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.aarti-live-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
}

.aarti-banner-tag {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--accent);
  text-transform: uppercase;
}

.aarti-banner-title {
  font-size: 1.15rem;
  font-weight: 800;
  margin: 0.15rem 0 0;
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.aarti-time-chip {
  font-size: 0.8rem;
  font-weight: 800;
  background: var(--accent);
  color: #160B0C;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  font-family: monospace;
}

.aarti-banner-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.aarti-badge-day {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
}

.badge-today { background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
.badge-tomorrow { background: rgba(224, 165, 38, 0.15); color: var(--accent); border: 1px solid rgba(224, 165, 38, 0.3); }

.aarti-dhaka-clock {
  font-size: 0.775rem;
  color: var(--text-muted);
  font-family: monospace;
}

/* Filters Bar */
.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 260px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  font-size: 0.85rem;
  opacity: 0.6;
}

.search-input {
  width: 100%;
  padding: 0.65rem 2.25rem 0.65rem 2.4rem;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s ease;
}

.search-input:focus {
  border-color: var(--accent);
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
}

.filter-pills {
  display: flex;
  gap: 0.4rem;
}

.filter-pill {
  padding: 0.45rem 0.95rem;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 0.825rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill:hover {
  border-color: var(--accent);
}

.filter-pill-active {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--accent);
}

/* Schedule Table Card */
.schedule-table-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

.ritual-items-list {
  display: flex;
  flex-direction: column;
}

.schedule-row-item {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.15rem 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
  transition: background 0.15s ease;
}

.schedule-row-item:last-child {
  border-bottom: none;
}

.schedule-row-item:hover {
  background: rgba(255, 255, 255, 0.02);
}

.item-inactive {
  opacity: 0.6;
  background: var(--bg-secondary);
}

.reorder-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.btn-reorder {
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 0.65rem;
  width: 22px;
  height: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.btn-reorder:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-reorder:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.sort-order-num {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-muted);
}

.time-col {
  flex-shrink: 0;
}

.ritual-time-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  background: var(--accent-glow);
  border: 1px solid rgba(224, 165, 38, 0.35);
}

.clock-icon { font-size: 0.85rem; }
.time-text {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--accent);
  font-family: monospace;
}

.details-col {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
  flex-wrap: wrap;
}

.ritual-title-en {
  font-size: 1.05rem;
  font-weight: 800;
  margin: 0;
  color: var(--text-primary);
}

.ritual-title-bn {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--action-btn-bg);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.ritual-desc-en {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0 0 0.2rem;
  line-height: 1.45;
}

.ritual-desc-bn {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}

.toggle-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.status-caption {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.caption-active { color: #22c55e; }
.caption-hidden { color: var(--text-muted); }

/* Switch Slider */
.switch-toggle {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
}

.switch-toggle input { opacity: 0; width: 0; height: 0; }

.switch-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--border-color);
  transition: 0.2s;
  border-radius: 22px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .switch-slider {
  background-color: #22c55e;
}

input:checked + .switch-slider:before {
  transform: translateX(18px);
}

.actions-col {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-action-edit {
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.825rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-action-edit:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-action-del {
  padding: 0.45rem 0.65rem;
  border-radius: 6px;
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  color: #f87171;
  font-size: 0.825rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-action-del:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}

/* Loading & Empty State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  padding: 4rem 2rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(224, 165, 38, 0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
.empty-title { font-size: 1.2rem; font-weight: 800; margin: 0 0 0.35rem; }
.empty-desc { font-size: 0.875rem; color: var(--text-secondary); margin: 0 0 1.25rem; }

/* ====================================================
   MODAL DIALOG STYLES
   ==================================================== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(5px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-dialog {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 18px;
  max-width: 580px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5);
}

.modal-dialog-sm {
  max-width: 440px;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.modal-tag {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--accent);
  text-transform: uppercase;
}

.modal-title {
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0.2rem 0 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
}

.modal-close-btn:hover { color: var(--text-primary); }

.modal-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.825rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.required-star { color: #f87171; }

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s ease;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--accent);
}

.font-mono { font-family: monospace; }

.error-msg {
  font-size: 0.75rem;
  color: #f87171;
  font-weight: 600;
}

.time-presets-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.45rem;
  flex-wrap: wrap;
}

.preset-label {
  font-size: 0.725rem;
  color: var(--text-muted);
  font-weight: 600;
}

.preset-chip {
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  font-size: 0.725rem;
  font-weight: 700;
  color: var(--accent);
  cursor: pointer;
  font-family: monospace;
  transition: all 0.15s;
}

.preset-chip:hover {
  background: var(--accent-glow);
  border-color: var(--accent);
}

/* Bilingual Tabs */
.lang-tabs-nav {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-subtle);
}

.lang-tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
}

.lang-tab-active {
  background: var(--accent);
  color: #160B0C;
  border-color: var(--accent);
}

.lang-req-dot { color: #f87171; font-weight: 800; }
.lang-opt-badge { font-size: 0.65rem; opacity: 0.8; }

.lang-fields-box {
  margin-bottom: 1rem;
}

.form-row-2 {
  display: flex;
  gap: 1rem;
}

.flex-1 { flex: 1; }

.hint-text {
  font-size: 0.725rem;
  color: var(--text-muted);
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  margin-top: 0.35rem;
}

.checkbox-container input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--accent);
}

.checkbox-label-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-footer {
  padding: 1.15rem 1.5rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-cancel {
  padding: 0.6rem 1.15rem;
  border-radius: 8px;
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-save {
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  background: var(--accent);
  color: #160B0C;
  font-size: 0.85rem;
  font-weight: 800;
  border: none;
  cursor: pointer;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-text {
  font-size: 0.95rem;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
  line-height: 1.5;
}

.confirm-warning {
  font-size: 0.825rem;
  color: var(--text-muted);
  margin: 0;
}

.btn-delete-confirm {
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  background: #b91c1c;
  color: white;
  font-size: 0.85rem;
  font-weight: 800;
  border: none;
  cursor: pointer;
}

.btn-delete-confirm:hover { background: #dc2626; }
.btn-delete-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

/* ====================================================
   PUJAS & SERVICES STYLING
   ==================================================== */
.amber-icon {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.puja-items-list {
  display: flex;
  flex-direction: column;
}

.puja-row-item {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
  transition: background 0.15s ease;
}

.puja-row-item:last-child {
  border-bottom: none;
}

.puja-row-item:hover {
  background: rgba(255, 255, 255, 0.02);
}

.puja-meta-badge-col {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex-shrink: 0;
  min-width: 105px;
}

.puja-price-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 0.2rem;
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  background: var(--accent-glow);
  border: 1px solid rgba(224, 165, 38, 0.35);
}

.currency-sym {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--accent);
}

.price-val {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: -0.01em;
}

.puja-duration-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--action-btn-bg);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  width: fit-content;
}

.puja-details-col {
  flex: 1;
  min-width: 0;
}

.puja-title-en {
  font-size: 1.05rem;
  font-weight: 800;
  margin: 0;
  color: var(--text-primary);
}

.puja-title-bn {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--action-btn-bg);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.puja-slug-pill {
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
}

.puja-desc-en {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem;
  line-height: 1.45;
}

.puja-desc-bn {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0 0 0.4rem;
}

.puja-offered-box {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  background: rgba(224, 165, 38, 0.05);
  border: 1px dashed rgba(224, 165, 38, 0.25);
  padding: 0.45rem 0.75rem;
  border-radius: 6px;
  margin-top: 0.4rem;
}

.offered-icon {
  font-size: 0.85rem;
  margin-top: 0.1rem;
}

.offered-content {
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--text-secondary);
}

.offered-label {
  font-weight: 700;
  color: var(--accent);
  margin-right: 0.35rem;
}

.offered-text-bn {
  color: var(--text-muted);
  margin-left: 0.25rem;
}

.puja-toggles-col {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  flex-shrink: 0;
  min-width: 130px;
}

.mini-toggle-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.mini-toggle-title {
  font-size: 0.675rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.mini-toggle-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.switch-slider-blue {
  background-color: var(--border-color);
}

input:checked + .switch-slider-blue {
  background-color: #3b82f6;
}

.caption-bookable {
  color: #60a5fa;
}

/* Modal Dialog Large for Puja */
.modal-dialog-lg {
  max-width: 720px;
  width: 95%;
}

.form-row-3 {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.align-center {
  align-items: center;
}

.input-with-prefix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 0.85rem;
  color: var(--text-muted);
  font-weight: 800;
  font-size: 0.95rem;
  pointer-events: none;
}

.input-with-prefix .form-input {
  padding-left: 2rem;
}

.chip-presets-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.4rem;
}

.chip-presets-row .preset-chip {
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 0.725rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chip-presets-row .preset-chip:hover {
  border-color: var(--accent);
  color: var(--accent);
}

@media (max-width: 768px) {
  .admin-topbar { padding: 0 1.25rem; }
  .dashboard-body { padding: 1.5rem 1.25rem 3rem; }
  .schedule-row-item { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .actions-col { width: 100%; justify-content: flex-end; }
  .toggle-col { flex-direction: row; gap: 0.5rem; }
  .form-row-2 { flex-direction: column; }
  .puja-row-item { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .puja-toggles-col { flex-direction: row; gap: 1.5rem; width: 100%; justify-content: flex-start; }
  .form-row-3 { flex-direction: column; gap: 0.75rem; }
}
</style>
