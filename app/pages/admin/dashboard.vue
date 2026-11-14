<script setup lang="ts">
import { ref, reactive, computed, onMounted, watchEffect } from "vue";
import { useAuth } from "~/composables/useAuth";
import type { FormattedScheduleItem, NextAartiResult } from "~~/server/services/schedule";
import type { FormattedPujaItem } from "~~/server/services/pujas";
import type { FormattedDeityItem } from "~~/server/services/deities";
import type { FormattedNoticeItem } from "~~/server/services/notices";
import type { FormattedEventItem } from "~~/server/services/events";
import type { BookingStatus, MessageStatus } from "~~/shared/schemas/forms";
import { defaultAboutData, type AboutPageData } from "~~/server/cms/aboutDefaults";
import {
  defaultSiteSettingsData,
  type SiteSettingsData,
  FONT_OPTIONS_HEADING,
  FONT_OPTIONS_BODY,
  THEME_PALETTES,
} from "~~/shared/schemas/siteSettings";

useHead({
  title: "Sanctum Dashboard - Temple Console",
});

const { isAuthenticated, isPending, isStaff, isAdmin, isEditor, currentUser, role, logout } = useAuth();
const { $trpc } = useNuxtApp();

// Route guard - only admin or editor can access /admin/**
watchEffect(() => {
  if (isPending.value) return;

  if (!isAuthenticated.value) {
    navigateTo("/admin/login");
  } else if (!isStaff.value) {
    navigateTo("/account");
  }
});

const isSidebarOpen = ref(false);
const activeModule = ref<
  "dashboard" | "schedule" | "pujas" | "events" | "deities" | "notices" | "bookings" | "messages" | "about_cms" | "site_settings"
>("dashboard");

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
  { id: "dashboard", label: "Dashboard Overview", badge: "Live" },
  { id: "schedule", label: "Daily Schedule", badge: "Rituals" },
  { id: "pujas", label: "Pujas & Services", badge: "Offerings" },
  { id: "events", label: "Festivals & Events", badge: "Festivals" },
  { id: "deities", label: "Deities & Shrines", badge: "Sacred" },
  { id: "notices", label: "Temple Notices", badge: "Board" },
  { id: "bookings", label: "Puja Bookings", badge: "Devotees" },
  { id: "messages", label: "Contact Messages", badge: "Inquiries" },
  { id: "about_cms", label: "About Page Content", badge: "CMS" },
  { id: "site_settings", label: "General Site Settings", badge: "Global" },
];

// Navigation Groups for clean sidebar structure
const navGroups = computed(() => [
  {
    title: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", badge: "" },
    ],
  },
  {
    title: "Rituals & Pujas",
    items: [
      { id: "schedule", label: "Daily Schedule", badge: "" },
      { id: "pujas", label: "Pujas & Services", badge: "" },
      { id: "events", label: "Festivals & Events", badge: "" },
    ],
  },
  {
    title: "Mandir Content",
    items: [
      { id: "deities", label: "Deities & Shrines", badge: "" },
      { id: "notices", label: "Temple Notices", badge: "" },
      { id: "about_cms", label: "About Page Content", badge: "CMS" },
    ],
  },
  {
    title: "Devotee Services",
    items: [
      {
        id: "bookings",
        label: "Puja Bookings",
        badge: newBookingsCount.value > 0 ? `${newBookingsCount.value} new` : "",
      },
      {
        id: "messages",
        label: "Contact Messages",
        badge: newMessagesCount.value > 0 ? `${newMessagesCount.value} new` : "",
      },
    ],
  },
  {
    title: "Configuration",
    items: [
      { id: "site_settings", label: "General Site Settings", badge: "Global" },
    ],
  },
]);


// =========================================================================
// GENERAL SITE SETTINGS STATE & METHODS
// =========================================================================
const siteSettingsData = ref<SiteSettingsData>(JSON.parse(JSON.stringify(defaultSiteSettingsData)));
const loadingSiteSettings = ref(false);
const savingSiteSettings = ref(false);

const applyPalettePreset = (paletteId: string) => {
  const p = THEME_PALETTES.find((pal) => pal.id === paletteId);
  if (p) {
    siteSettingsData.value.theme.colorPalette = p.id;
    siteSettingsData.value.theme.primaryColor = p.primary;
    siteSettingsData.value.theme.secondaryColor = p.secondary;
    siteSettingsData.value.theme.accentColor = p.accent;
    siteSettingsData.value.theme.backgroundColor = p.bg;
  }
};

const fetchSiteSettingsData = async () => {
  loadingSiteSettings.value = true;
  try {
    const res = await $fetch<SiteSettingsData>("/api/cms/site-settings");
    if (res) {
      siteSettingsData.value = JSON.parse(JSON.stringify(res));
    }
  } catch (err: any) {
    console.error("Failed to load site settings:", err);
  } finally {
    loadingSiteSettings.value = false;
  }
};

const saveSiteSettings = async () => {
  savingSiteSettings.value = true;
  try {
    const res = await $fetch<{ success: boolean; data: SiteSettingsData }>("/api/cms/site-settings", {
      method: "POST",
      body: { data: siteSettingsData.value },
    });
    if (res.success) {
      showToast("General site settings saved successfully!");
    }
  } catch (err: any) {
    showToast(err?.data?.message || err?.message || "Failed to save site settings", "error");
  } finally {
    savingSiteSettings.value = false;
  }
};

const resetSiteSettings = async () => {
  if (!confirm("Are you sure you want to reset all General Site Settings to default temple values?")) return;
  savingSiteSettings.value = true;
  try {
    const res = await $fetch<{ success: boolean; data: SiteSettingsData }>("/api/cms/site-settings", {
      method: "POST",
      body: { action: "reset" },
    });
    if (res.success) {
      siteSettingsData.value = JSON.parse(JSON.stringify(res.data));
      showToast("Site settings reset to temple defaults!");
    }
  } catch (err: any) {
    showToast(err?.data?.message || err?.message || "Failed to reset site settings", "error");
  } finally {
    savingSiteSettings.value = false;
  }
};


// =========================================================================
// ABOUT PAGE CMS STATE & METHODS
// =========================================================================
const aboutCmsData = ref<AboutPageData>(JSON.parse(JSON.stringify(defaultAboutData)));
const loadingAboutCms = ref(false);
const savingAboutCms = ref(false);

const fetchAboutCmsData = async () => {
  loadingAboutCms.value = true;
  try {
    const res = await $fetch<AboutPageData>("/api/cms/about");
    if (res) {
      aboutCmsData.value = JSON.parse(JSON.stringify(res));
    }
  } catch (err: any) {
    console.error("Failed to load about CMS:", err);
  } finally {
    loadingAboutCms.value = false;
  }
};

const saveAboutCms = async () => {
  savingAboutCms.value = true;
  try {
    const res = await $fetch<{ success: boolean; data: AboutPageData }>("/api/cms/about", {
      method: "POST",
      body: { data: aboutCmsData.value },
    });
    if (res.success) {
      showToast("About page content saved successfully!");
    }
  } catch (err: any) {
    showToast(err?.data?.message || err?.message || "Failed to save about page", "error");
  } finally {
    savingAboutCms.value = false;
  }
};

const resetAboutCms = async () => {
  if (!confirm("Are you sure you want to reset all About Page content to original temple defaults?")) return;
  savingAboutCms.value = true;
  try {
    const res = await $fetch<{ success: boolean; data: AboutPageData }>("/api/cms/about", {
      method: "POST",
      body: { action: "reset" },
    });
    if (res.success) {
      aboutCmsData.value = JSON.parse(JSON.stringify(res.data));
      showToast("About page content reset to defaults!");
    }
  } catch (err: any) {
    showToast(err?.data?.message || err?.message || "Failed to reset about page", "error");
  } finally {
    savingAboutCms.value = false;
  }
};

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
  fetchEventsData();
  fetchDeitiesData();
  fetchNoticesData();
  fetchBookingsData();
  fetchMessagesData();
  fetchAboutCmsData();
  fetchSiteSettingsData();
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

// =========================================================================
// DEITIES & SACRED SHRINES STATE & METHODS
// =========================================================================
const deityItems = ref<FormattedDeityItem[]>([]);
const loadingDeities = ref(false);
const deitySearchQuery = ref("");
const deityFilter = ref<"all" | "active" | "hidden">("all");

const fetchDeitiesData = async () => {
  loadingDeities.value = true;
  try {
    const res = await $trpc.deities.list.query();
    if (res && res.items) {
      deityItems.value = res.items;
    }
  } catch (err: any) {
    console.error("Failed to load deities:", err);
    showToast(err?.message || "Failed to load deities data", "error");
  } finally {
    loadingDeities.value = false;
  }
};

const filteredDeities = computed(() => {
  return deityItems.value.filter((item) => {
    if (deityFilter.value === "active" && !item.active) return false;
    if (deityFilter.value === "hidden" && item.active) return false;

    if (deitySearchQuery.value.trim()) {
      const q = deitySearchQuery.value.trim().toLowerCase();
      const matchSlug = item.slug.toLowerCase().includes(q);
      const matchNameEn = item.name.en.toLowerCase().includes(q);
      const matchNameBn = (item.name.bn || "").toLowerCase().includes(q);
      const matchSubEn = (item.subtitle?.en || "").toLowerCase().includes(q);
      const matchSubBn = (item.subtitle?.bn || "").toLowerCase().includes(q);
      const matchDescEn = (item.description.en || "").toLowerCase().includes(q);
      const matchDescBn = (item.description.bn || "").toLowerCase().includes(q);
      return (
        matchSlug ||
        matchNameEn ||
        matchNameBn ||
        matchSubEn ||
        matchSubBn ||
        matchDescEn ||
        matchDescBn
      );
    }

    return true;
  });
});

const totalDeitiesCount = computed(() => deityItems.value.length);
const activeDeitiesCount = computed(() => deityItems.value.filter((d) => d.active).length);
const hiddenDeitiesCount = computed(() => deityItems.value.filter((d) => !d.active).length);

const isDeityModalOpen = ref(false);
const isEditingDeity = ref(false);
const savingDeity = ref(false);
const currentEditingDeityId = ref<number | null>(null);
const activeDeityLangTab = ref<"en" | "bn">("en");
const autoDeitySlugEnabled = ref(true);

const deityForm = reactive({
  slug: "",
  nameEn: "",
  nameBn: "",
  subtitleEn: "",
  subtitleBn: "",
  descEn: "",
  descBn: "",
  imageId: "",
  sortOrder: 0,
  active: true,
});

const deityFormErrors = reactive({
  slug: "",
  nameEn: "",
  descEn: "",
});

const onDeityNameEnInput = () => {
  if (autoDeitySlugEnabled.value && !isEditingDeity.value) {
    deityForm.slug = generateSlug(deityForm.nameEn);
  }
};

const onDeitySlugManualEdit = () => {
  autoDeitySlugEnabled.value = false;
};

const openAddDeityModal = () => {
  isEditingDeity.value = false;
  currentEditingDeityId.value = null;
  autoDeitySlugEnabled.value = true;
  deityForm.slug = "";
  deityForm.nameEn = "";
  deityForm.nameBn = "";
  deityForm.subtitleEn = "";
  deityForm.subtitleBn = "";
  deityForm.descEn = "";
  deityForm.descBn = "";
  deityForm.imageId = "";
  deityForm.sortOrder = deityItems.value.length + 1;
  deityForm.active = true;
  deityFormErrors.slug = "";
  deityFormErrors.nameEn = "";
  deityFormErrors.descEn = "";
  activeDeityLangTab.value = "en";
  isDeityModalOpen.value = true;
};

const openEditDeityModal = (item: FormattedDeityItem) => {
  isEditingDeity.value = true;
  currentEditingDeityId.value = item.id;
  autoDeitySlugEnabled.value = false;
  deityForm.slug = item.slug;
  deityForm.nameEn = item.name.en || "";
  deityForm.nameBn = item.name.bn || "";
  deityForm.subtitleEn = item.subtitle?.en || "";
  deityForm.subtitleBn = item.subtitle?.bn || "";
  deityForm.descEn = item.description.en || "";
  deityForm.descBn = item.description.bn || "";
  deityForm.imageId = item.imageId || "";
  deityForm.sortOrder = item.sortOrder;
  deityForm.active = item.active;
  deityFormErrors.slug = "";
  deityFormErrors.nameEn = "";
  deityFormErrors.descEn = "";
  activeDeityLangTab.value = "en";
  isDeityModalOpen.value = true;
};

const validateDeityForm = () => {
  let valid = true;
  deityFormErrors.slug = "";
  deityFormErrors.nameEn = "";
  deityFormErrors.descEn = "";

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!deityForm.slug.trim()) {
    deityFormErrors.slug = "Slug is required (e.g. maa-kali)";
    valid = false;
  } else if (!slugRegex.test(deityForm.slug.trim())) {
    deityFormErrors.slug = "Slug must contain only lowercase letters, numbers, and hyphens";
    valid = false;
  }

  if (!deityForm.nameEn.trim()) {
    deityFormErrors.nameEn = "English deity name is required";
    valid = false;
  }

  if (!deityForm.descEn.trim()) {
    deityFormErrors.descEn = "English description is required";
    valid = false;
  }

  return valid;
};

const saveDeityItem = async () => {
  if (!validateDeityForm()) return;

  savingDeity.value = true;
  try {
    const inputPayload = {
      slug: deityForm.slug.trim().toLowerCase(),
      name: { en: deityForm.nameEn.trim(), bn: deityForm.nameBn.trim() },
      subtitle:
        deityForm.subtitleEn.trim() || deityForm.subtitleBn.trim()
          ? { en: deityForm.subtitleEn.trim(), bn: deityForm.subtitleBn.trim() }
          : undefined,
      description: { en: deityForm.descEn.trim(), bn: deityForm.descBn.trim() },
      imageId: deityForm.imageId.trim() || undefined,
      sortOrder: deityForm.sortOrder,
      active: deityForm.active,
    };

    if (isEditingDeity.value && currentEditingDeityId.value !== null) {
      await $trpc.deities.update.mutate({
        id: currentEditingDeityId.value,
        ...inputPayload,
      });
      showToast("Deity profile updated successfully!");
    } else {
      await $trpc.deities.create.mutate(inputPayload);
      showToast("New deity profile created successfully!");
    }

    isDeityModalOpen.value = false;
    await fetchDeitiesData();
  } catch (err: any) {
    console.error("Failed to save deity:", err);
    showToast(err?.message || "Failed to save deity profile", "error");
  } finally {
    savingDeity.value = false;
  }
};

const toggleDeityActiveStatus = async (item: FormattedDeityItem) => {
  try {
    const nextState = !item.active;
    await $trpc.deities.setActive.mutate({
      id: item.id,
      active: nextState,
    });
    item.active = nextState;
    showToast(`'${item.name.en}' is now ${nextState ? 'Active' : 'Hidden'}`);
    await fetchDeitiesData();
  } catch (err: any) {
    showToast(err?.message || "Failed to toggle status", "error");
  }
};

const moveDeityOrder = async (index: number, direction: "up" | "down") => {
  const target = direction === "up" ? index - 1 : index + 1;
  const list = [...filteredDeities.value];
  if (target < 0 || target >= list.length) return;

  const current = list[index];
  const other = list[target];
  if (!current || !other) return;

  const tempOrder = current.sortOrder;
  current.sortOrder = other.sortOrder;
  other.sortOrder = tempOrder;

  try {
    await $trpc.deities.reorder.mutate({
      items: [
        { id: current.id, sortOrder: current.sortOrder },
        { id: other.id, sortOrder: other.sortOrder },
      ],
    });
    showToast("Deities reordered successfully!");
    await fetchDeitiesData();
  } catch (err: any) {
    showToast(err?.message || "Failed to reorder", "error");
  }
};

const deleteConfirmDeity = ref<FormattedDeityItem | null>(null);
const deletingDeity = ref(false);

const confirmDeleteDeity = (item: FormattedDeityItem) => {
  deleteConfirmDeity.value = item;
};

const executeDeleteDeity = async () => {
  if (!deleteConfirmDeity.value) return;

  deletingDeity.value = true;
  try {
    await $trpc.deities.delete.mutate({ id: deleteConfirmDeity.value.id });
    showToast(`Deleted '${deleteConfirmDeity.value.name.en}' successfully!`);
    deleteConfirmDeity.value = null;
    await fetchDeitiesData();
  } catch (err: any) {
    showToast(err?.message || "Failed to delete deity", "error");
  } finally {
    deletingDeity.value = false;
  }
};

// =========================================================================
// TEMPLE NOTICES STATE & METHODS
// =========================================================================
const noticeItems = ref<FormattedNoticeItem[]>([]);
const loadingNotices = ref(false);
const noticeSearchQuery = ref("");
const noticeCategoryFilter = ref<string>("all");
const noticeFilter = ref<"all" | "pinned" | "active" | "hidden">("all");

const noticeCategories = [
  { id: "all", label: "All Categories" },
  { id: "general", label: "General Notice" },
  { id: "festival", label: "Festival / Puja" },
  { id: "timings", label: "Mandir Timings" },
  { id: "announcement", label: "Announcement" },
];

const fetchNoticesData = async () => {
  loadingNotices.value = true;
  try {
    const res = await $trpc.notices.list.query();
    if (res && res.items) {
      noticeItems.value = res.items;
    }
  } catch (err: any) {
    console.error("Failed to load notices:", err);
    showToast(err?.message || "Failed to load notices data", "error");
  } finally {
    loadingNotices.value = false;
  }
};

const filteredNotices = computed(() => {
  return noticeItems.value.filter((item) => {
    // 1. Status / pinned filter
    if (noticeFilter.value === "pinned" && !item.pinned) return false;
    if (noticeFilter.value === "active" && !item.active) return false;
    if (noticeFilter.value === "hidden" && item.active) return false;

    // 2. Category filter
    if (noticeCategoryFilter.value !== "all" && item.category !== noticeCategoryFilter.value) {
      return false;
    }

    // 3. Search query filter
    if (noticeSearchQuery.value.trim()) {
      const q = noticeSearchQuery.value.trim().toLowerCase();
      const matchSlug = item.slug.toLowerCase().includes(q);
      const matchTitleEn = item.title.en.toLowerCase().includes(q);
      const matchTitleBn = (item.title.bn || "").toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchBodyEn = (item.body.en || "").toLowerCase().includes(q);
      const matchBodyBn = (item.body.bn || "").toLowerCase().includes(q);
      return (
        matchSlug ||
        matchTitleEn ||
        matchTitleBn ||
        matchCat ||
        matchBodyEn ||
        matchBodyBn
      );
    }

    return true;
  });
});

const totalNoticesCount = computed(() => noticeItems.value.length);
const pinnedNoticesCount = computed(() => noticeItems.value.filter((n) => n.pinned).length);
const activeNoticesCount = computed(() => noticeItems.value.filter((n) => n.active).length);

const isNoticeModalOpen = ref(false);
const isEditingNotice = ref(false);
const savingNotice = ref(false);
const currentEditingNoticeId = ref<number | null>(null);
const activeNoticeLangTab = ref<"en" | "bn">("en");
const autoNoticeSlugEnabled = ref(true);

const noticeForm = reactive({
  slug: "",
  titleEn: "",
  titleBn: "",
  category: "general",
  date: "",
  bodyEn: "",
  bodyBn: "",
  pinned: false,
  active: true,
});

const noticeFormErrors = reactive({
  slug: "",
  titleEn: "",
  date: "",
  bodyEn: "",
});

const onNoticeTitleEnInput = () => {
  if (autoNoticeSlugEnabled.value && !isEditingNotice.value) {
    noticeForm.slug = generateSlug(noticeForm.titleEn);
  }
};

const onNoticeSlugManualEdit = () => {
  autoNoticeSlugEnabled.value = false;
};

const openAddNoticeModal = () => {
  isEditingNotice.value = false;
  currentEditingNoticeId.value = null;
  autoNoticeSlugEnabled.value = true;
  noticeForm.slug = "";
  noticeForm.titleEn = "";
  noticeForm.titleBn = "";
  noticeForm.category = "general";
  noticeForm.date = new Date().toISOString().slice(0, 10);
  noticeForm.bodyEn = "";
  noticeForm.bodyBn = "";
  noticeForm.pinned = false;
  noticeForm.active = true;
  noticeFormErrors.slug = "";
  noticeFormErrors.titleEn = "";
  noticeFormErrors.date = "";
  noticeFormErrors.bodyEn = "";
  activeNoticeLangTab.value = "en";
  isNoticeModalOpen.value = true;
};

const openEditNoticeModal = (item: FormattedNoticeItem) => {
  isEditingNotice.value = true;
  currentEditingNoticeId.value = item.id;
  autoNoticeSlugEnabled.value = false;
  noticeForm.slug = item.slug;
  noticeForm.titleEn = item.title.en || "";
  noticeForm.titleBn = item.title.bn || "";
  noticeForm.category = item.category || "general";
  noticeForm.date = item.date;
  noticeForm.bodyEn = item.body.en || "";
  noticeForm.bodyBn = item.body.bn || "";
  noticeForm.pinned = item.pinned;
  noticeForm.active = item.active;
  noticeFormErrors.slug = "";
  noticeFormErrors.titleEn = "";
  noticeFormErrors.date = "";
  noticeFormErrors.bodyEn = "";
  activeNoticeLangTab.value = "en";
  isNoticeModalOpen.value = true;
};

const validateNoticeForm = () => {
  let valid = true;
  noticeFormErrors.slug = "";
  noticeFormErrors.titleEn = "";
  noticeFormErrors.date = "";
  noticeFormErrors.bodyEn = "";

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!noticeForm.slug.trim()) {
    noticeFormErrors.slug = "Slug is required (e.g. mandir-timing-update)";
    valid = false;
  } else if (!slugRegex.test(noticeForm.slug.trim())) {
    noticeFormErrors.slug = "Slug must contain only lowercase letters, numbers, and hyphens";
    valid = false;
  }

  if (!noticeForm.titleEn.trim()) {
    noticeFormErrors.titleEn = "English notice title is required";
    valid = false;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!noticeForm.date || !dateRegex.test(noticeForm.date)) {
    noticeFormErrors.date = "Date must be in YYYY-MM-DD format";
    valid = false;
  }

  if (!noticeForm.bodyEn.trim()) {
    noticeFormErrors.bodyEn = "English notice body is required";
    valid = false;
  }

  return valid;
};

const saveNoticeItem = async () => {
  if (!validateNoticeForm()) return;

  savingNotice.value = true;
  try {
    const inputPayload = {
      slug: noticeForm.slug.trim().toLowerCase(),
      title: { en: noticeForm.titleEn.trim(), bn: noticeForm.titleBn.trim() },
      category: noticeForm.category.trim(),
      date: noticeForm.date,
      body: { en: noticeForm.bodyEn.trim(), bn: noticeForm.bodyBn.trim() },
      pinned: noticeForm.pinned,
      active: noticeForm.active,
    };

    if (isEditingNotice.value && currentEditingNoticeId.value !== null) {
      await $trpc.notices.update.mutate({
        id: currentEditingNoticeId.value,
        ...inputPayload,
      });
      showToast("Notice updated successfully!");
    } else {
      await $trpc.notices.create.mutate(inputPayload);
      showToast("New notice published successfully!");
    }

    isNoticeModalOpen.value = false;
    await fetchNoticesData();
  } catch (err: any) {
    console.error("Failed to save notice:", err);
    showToast(err?.message || "Failed to save notice", "error");
  } finally {
    savingNotice.value = false;
  }
};

const toggleNoticePinnedStatus = async (item: FormattedNoticeItem) => {
  try {
    const nextState = !item.pinned;
    await $trpc.notices.setPinned.mutate({
      id: item.id,
      pinned: nextState,
    });
    item.pinned = nextState;
    showToast(`'${item.title.en}' is now ${nextState ? 'Pinned to top' : 'Unpinned'}`);
    await fetchNoticesData();
  } catch (err: any) {
    showToast(err?.message || "Failed to toggle pin", "error");
  }
};

const toggleNoticeActiveStatus = async (item: FormattedNoticeItem) => {
  try {
    const nextState = !item.active;
    await $trpc.notices.setActive.mutate({
      id: item.id,
      active: nextState,
    });
    item.active = nextState;
    showToast(`'${item.title.en}' is now ${nextState ? 'Active' : 'Hidden'}`);
    await fetchNoticesData();
  } catch (err: any) {
    showToast(err?.message || "Failed to toggle status", "error");
  }
};

const deleteConfirmNotice = ref<FormattedNoticeItem | null>(null);
const deletingNotice = ref(false);

const confirmDeleteNotice = (item: FormattedNoticeItem) => {
  deleteConfirmNotice.value = item;
};

const executeDeleteNotice = async () => {
  if (!deleteConfirmNotice.value) return;

  deletingNotice.value = true;
  try {
    await $trpc.notices.delete.mutate({ id: deleteConfirmNotice.value.id });
    showToast(`Deleted '${deleteConfirmNotice.value.title.en}' successfully!`);
    deleteConfirmNotice.value = null;
    await fetchNoticesData();
  } catch (err: any) {
    showToast(err?.message || "Failed to delete notice", "error");
  } finally {
    deletingNotice.value = false;
  }
};

// =========================================================================
// PUJA BOOKINGS MANAGER STATE & METHODS
// =========================================================================
interface AdminBookingItem {
  id: number;
  ref: string;
  userId: string | null;
  pujaId: number | null;
  name: string;
  phone: string;
  email: string | null;
  gotra: string | null;
  preferredDate: string;
  note: string | null;
  status: BookingStatus;
  handledBy: string | null;
  adminNote: string | null;
  createdAt: number;
  updatedAt: number;
  pujaName?: { en: string; bn: string };
  pujaSlug?: string;
  pujaPrice?: number;
}

const bookingItems = ref<AdminBookingItem[]>([]);
const loadingBookings = ref(false);
const bookingSearchQuery = ref("");
const bookingStatusFilter = ref<"all" | BookingStatus>("all");

const fetchBookingsData = async () => {
  loadingBookings.value = true;
  try {
    const res = await $trpc.bookings.list.query();
    if (res && res.items) {
      bookingItems.value = res.items as AdminBookingItem[];
    }
  } catch (err: any) {
    console.error("Failed to load bookings:", err);
    showToast(err?.message || "Failed to load bookings data", "error");
  } finally {
    loadingBookings.value = false;
  }
};

const filteredBookings = computed(() => {
  return bookingItems.value.filter((item) => {
    // 1. Status filter
    if (bookingStatusFilter.value !== "all" && item.status !== bookingStatusFilter.value) {
      return false;
    }

    // 2. Search query filter
    if (bookingSearchQuery.value.trim()) {
      const q = bookingSearchQuery.value.trim().toLowerCase();
      const matchRef = item.ref.toLowerCase().includes(q);
      const matchName = item.name.toLowerCase().includes(q);
      const matchPhone = item.phone.toLowerCase().includes(q);
      const matchEmail = (item.email || "").toLowerCase().includes(q);
      const matchGotra = (item.gotra || "").toLowerCase().includes(q);
      const matchPuja = (item.pujaName?.en || "").toLowerCase().includes(q);
      return (
        matchRef ||
        matchName ||
        matchPhone ||
        matchEmail ||
        matchGotra ||
        matchPuja
      );
    }

    return true;
  });
});

const totalBookingsCount = computed(() => bookingItems.value.length);
const newBookingsCount = computed(() => bookingItems.value.filter((b) => b.status === "new").length);
const confirmedBookingsCount = computed(() => bookingItems.value.filter((b) => b.status === "confirmed").length);
const completedBookingsCount = computed(() => bookingItems.value.filter((b) => b.status === "completed").length);
const cancelledBookingsCount = computed(() => bookingItems.value.filter((b) => b.status === "cancelled").length);

// Admin note / status action modal
const isBookingNoteModalOpen = ref(false);
const activeBookingNoteItem = ref<AdminBookingItem | null>(null);
const bookingAdminNoteInput = ref("");
const updatingBookingStatus = ref(false);

const openBookingNoteModal = (item: AdminBookingItem) => {
  activeBookingNoteItem.value = item;
  bookingAdminNoteInput.value = item.adminNote || "";
  isBookingNoteModalOpen.value = true;
};

const saveBookingAdminNote = async () => {
  if (!activeBookingNoteItem.value) return;

  updatingBookingStatus.value = true;
  try {
    await $trpc.bookings.updateStatus.mutate({
      id: activeBookingNoteItem.value.id,
      status: activeBookingNoteItem.value.status,
      adminNote: bookingAdminNoteInput.value.trim(),
    });
    showToast("Admin note saved successfully!");
    isBookingNoteModalOpen.value = false;
    await fetchBookingsData();
  } catch (err: any) {
    showToast(err?.message || "Failed to save note", "error");
  } finally {
    updatingBookingStatus.value = false;
  }
};

const changeBookingStatus = async (item: AdminBookingItem, newStatus: BookingStatus) => {
  try {
    await $trpc.bookings.updateStatus.mutate({
      id: item.id,
      status: newStatus,
      adminNote: item.adminNote || undefined,
    });
    item.status = newStatus;
    showToast(`Booking ${item.ref} marked as ${newStatus}!`);
    await fetchBookingsData();
  } catch (err: any) {
    showToast(err?.message || "Failed to update booking status", "error");
  }
};

const deleteConfirmBooking = ref<AdminBookingItem | null>(null);
const deletingBooking = ref(false);

const confirmDeleteBooking = (item: AdminBookingItem) => {
  deleteConfirmBooking.value = item;
};

const executeDeleteBooking = async () => {
  if (!deleteConfirmBooking.value) return;

  deletingBooking.value = true;
  try {
    await $trpc.bookings.delete.mutate({ id: deleteConfirmBooking.value.id });
    showToast(`Booking ${deleteConfirmBooking.value.ref} deleted successfully!`);
    deleteConfirmBooking.value = null;
    await fetchBookingsData();
  } catch (err: any) {
    showToast(err?.message || "Failed to delete booking", "error");
  } finally {
    deletingBooking.value = false;
  }
};


// =========================================================================
// CONTACT MESSAGES MANAGER STATE & METHODS
// =========================================================================
interface AdminMessageItem {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  subject: string;
  message: string;
  status: MessageStatus;
  adminNote: string | null;
  createdAt: number;
  updatedAt: number;
}

const messageItems = ref<AdminMessageItem[]>([]);
const loadingMessages = ref(false);
const messageSearchQuery = ref("");
const messageStatusFilter = ref<"all" | MessageStatus>("all");

const fetchMessagesData = async () => {
  loadingMessages.value = true;
  try {
    const res = await $trpc.messages.list.query();
    if (res && res.items) {
      messageItems.value = res.items as AdminMessageItem[];
    }
  } catch (err: any) {
    console.error("Failed to load contact messages:", err);
    showToast(err?.message || "Failed to load messages data", "error");
  } finally {
    loadingMessages.value = false;
  }
};

const filteredMessages = computed(() => {
  return messageItems.value.filter((item) => {
    // 1. Status filter
    if (messageStatusFilter.value !== "all" && item.status !== messageStatusFilter.value) {
      return false;
    }

    // 2. Search query filter
    if (messageSearchQuery.value.trim()) {
      const q = messageSearchQuery.value.trim().toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchSubject = item.subject.toLowerCase().includes(q);
      const matchMessage = item.message.toLowerCase().includes(q);
      const matchPhone = (item.phone || "").toLowerCase().includes(q);
      const matchEmail = (item.email || "").toLowerCase().includes(q);
      const matchId = item.id.toString().includes(q);
      return matchName || matchSubject || matchMessage || matchPhone || matchEmail || matchId;
    }

    return true;
  });
});

const totalMessagesCount = computed(() => messageItems.value.length);
const newMessagesCount = computed(() => messageItems.value.filter((m) => m.status === "new").length);
const readMessagesCount = computed(() => messageItems.value.filter((m) => m.status === "read").length);
const repliedMessagesCount = computed(() => messageItems.value.filter((m) => m.status === "replied").length);
const archivedMessagesCount = computed(() => messageItems.value.filter((m) => m.status === "archived").length);

// Admin note / view action modal
const isMessageModalOpen = ref(false);
const activeMessageItem = ref<AdminMessageItem | null>(null);
const messageAdminNoteInput = ref("");
const updatingMessageStatus = ref(false);

const openMessageModal = async (item: AdminMessageItem) => {
  activeMessageItem.value = item;
  messageAdminNoteInput.value = item.adminNote || "";
  isMessageModalOpen.value = true;

  // Auto-mark as read if newly opened
  if (item.status === "new") {
    try {
      await $trpc.messages.updateStatus.mutate({
        id: item.id,
        status: "read",
        adminNote: item.adminNote || undefined,
      });
      item.status = "read";
    } catch {
      // ignore
    }
  }
};

const saveMessageAdminNote = async () => {
  if (!activeMessageItem.value) return;

  updatingMessageStatus.value = true;
  try {
    await $trpc.messages.updateStatus.mutate({
      id: activeMessageItem.value.id,
      status: activeMessageItem.value.status,
      adminNote: messageAdminNoteInput.value.trim() || undefined,
    });
    activeMessageItem.value.adminNote = messageAdminNoteInput.value.trim() || null;
    showToast("Admin note saved successfully!");
    isMessageModalOpen.value = false;
    await fetchMessagesData();
  } catch (err: any) {
    showToast(err?.message || "Failed to save note", "error");
  } finally {
    updatingMessageStatus.value = false;
  }
};

const changeMessageStatus = async (item: AdminMessageItem, newStatus: MessageStatus) => {
  try {
    await $trpc.messages.updateStatus.mutate({
      id: item.id,
      status: newStatus,
      adminNote: item.adminNote || undefined,
    });
    item.status = newStatus;
    showToast(`Message marked as ${newStatus}!`);
    await fetchMessagesData();
  } catch (err: any) {
    showToast(err?.message || "Failed to update message status", "error");
  }
};

const deleteConfirmMessage = ref<AdminMessageItem | null>(null);
const deletingMessage = ref(false);

const confirmDeleteMessage = (item: AdminMessageItem) => {
  deleteConfirmMessage.value = item;
};

const executeDeleteMessage = async () => {
  if (!deleteConfirmMessage.value) return;

  deletingMessage.value = true;
  try {
    await $trpc.messages.delete.mutate({ id: deleteConfirmMessage.value.id });
    showToast("Message deleted successfully!");
    deleteConfirmMessage.value = null;
    await fetchMessagesData();
  } catch (err: any) {
    showToast(err?.message || "Failed to delete message", "error");
  } finally {
    deletingMessage.value = false;
  }
};

// =========================================================================
// EVENTS & FESTIVALS STATE & CRUD
// =========================================================================
const eventItems = ref<FormattedEventItem[]>([]);
const loadingEvents = ref(false);
const eventSearchQuery = ref("");
const eventFilter = ref<"all" | "festival" | "special_puja" | "seva" | "upcoming" | "active" | "hidden">("all");

// Dhaka today ISO date string
const getDhakaToday = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

const fetchEventsData = async () => {
  loadingEvents.value = true;
  try {
    const res = await $trpc.events.list.query({ pageSize: 100 });
    eventItems.value = res.items;
  } catch (err: any) {
    showToast(err?.message || "Failed to load events", "error");
  } finally {
    loadingEvents.value = false;
  }
};

const filteredEvents = computed(() => {
  const today = getDhakaToday();
  return eventItems.value.filter((item) => {
    // 1. Status / Kind filter
    if (eventFilter.value === "festival" && item.kind !== "festival") return false;
    if (eventFilter.value === "special_puja" && item.kind !== "special_puja") return false;
    if (eventFilter.value === "seva" && item.kind !== "seva") return false;
    if (eventFilter.value === "upcoming" && item.date < today) return false;
    if (eventFilter.value === "active" && !item.active) return false;
    if (eventFilter.value === "hidden" && item.active) return false;

    // 2. Search query
    if (eventSearchQuery.value.trim()) {
      const q = eventSearchQuery.value.toLowerCase().trim();
      const titleEn = item.title?.en?.toLowerCase() || "";
      const titleBn = item.title?.bn?.toLowerCase() || "";
      const labelEn = item.label?.en?.toLowerCase() || "";
      const labelBn = item.label?.bn?.toLowerCase() || "";
      const slug = item.slug?.toLowerCase() || "";
      const descEn = item.description?.en?.toLowerCase() || "";
      const descBn = item.description?.bn?.toLowerCase() || "";
      return (
        titleEn.includes(q) ||
        titleBn.includes(q) ||
        labelEn.includes(q) ||
        labelBn.includes(q) ||
        slug.includes(q) ||
        descEn.includes(q) ||
        descBn.includes(q)
      );
    }

    return true;
  });
});

// Summary counts
const totalEventsCount = computed(() => eventItems.value.length);
const upcomingEventsCount = computed(() => {
  const today = getDhakaToday();
  return eventItems.value.filter((item) => item.active && item.date >= today).length;
});
const activeEventsCount = computed(() => eventItems.value.filter((item) => item.active).length);
const hiddenEventsCount = computed(() => eventItems.value.filter((item) => !item.active).length);
const festivalsCount = computed(() => eventItems.value.filter((item) => item.kind === "festival").length);

// Modal state
const isEventModalOpen = ref(false);
const isEditingEvent = ref(false);
const savingEvent = ref(false);
const eventActiveTab = ref<"en" | "bn">("en");

const eventForm = reactive({
  id: null as number | null,
  slug: "",
  date: "",
  kind: "festival" as "special_puja" | "festival" | "seva" | "other",
  time: "",
  title: { en: "", bn: "" },
  label: { en: "", bn: "" },
  description: { en: "", bn: "" },
  active: true,
});

const openAddEventModal = () => {
  isEditingEvent.value = false;
  eventForm.id = null;
  eventForm.slug = "";
  eventForm.date = getDhakaToday();
  eventForm.kind = "festival";
  eventForm.time = "";
  eventForm.title = { en: "", bn: "" };
  eventForm.label = { en: "", bn: "" };
  eventForm.description = { en: "", bn: "" };
  eventForm.active = true;
  eventActiveTab.value = "en";
  isEventModalOpen.value = true;
};

const openEditEventModal = (item: FormattedEventItem) => {
  isEditingEvent.value = true;
  eventForm.id = item.id;
  eventForm.slug = item.slug;
  eventForm.date = item.date;
  eventForm.kind = item.kind;
  eventForm.time = item.time || "";
  eventForm.title = { en: item.title?.en || "", bn: item.title?.bn || "" };
  eventForm.label = { en: item.label?.en || "", bn: item.label?.bn || "" };
  eventForm.description = { en: item.description?.en || "", bn: item.description?.bn || "" };
  eventForm.active = item.active;
  eventActiveTab.value = "en";
  isEventModalOpen.value = true;
};

const autoGenerateEventSlug = () => {
  if (eventForm.title.en) {
    const year = eventForm.date ? `-${eventForm.date.slice(0, 4)}` : "";
    const base = eventForm.title.en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    eventForm.slug = `${base}${year}`;
  }
};

const toggleEventActive = async (item: FormattedEventItem) => {
  const newActive = !item.active;
  item.active = newActive;
  try {
    await $trpc.events.setActive.mutate({ id: item.id, active: newActive });
    showToast(`Event "${item.title.en}" marked as ${newActive ? 'active' : 'hidden'}`);
  } catch (err: any) {
    item.active = !newActive;
    showToast(err?.message || "Failed to update event status", "error");
  }
};

const saveEvent = async () => {
  if (!eventForm.title.en.trim()) {
    showToast("English title is required", "error");
    eventActiveTab.value = "en";
    return;
  }

  if (!eventForm.slug.trim()) {
    autoGenerateEventSlug();
  }

  if (!eventForm.date) {
    showToast("Event date is required", "error");
    return;
  }

  if (!eventForm.description.en.trim()) {
    showToast("English description is required", "error");
    eventActiveTab.value = "en";
    return;
  }

  savingEvent.value = true;
  try {
    const payload = {
      slug: eventForm.slug.trim(),
      date: eventForm.date,
      kind: eventForm.kind,
      time: eventForm.time.trim() || undefined,
      title: {
        en: eventForm.title.en.trim(),
        bn: eventForm.title.bn.trim(),
      },
      label: eventForm.label.en.trim() || eventForm.label.bn.trim() ? {
        en: eventForm.label.en.trim(),
        bn: eventForm.label.bn.trim(),
      } : undefined,
      description: {
        en: eventForm.description.en.trim(),
        bn: eventForm.description.bn.trim(),
      },
      active: eventForm.active,
    };

    if (isEditingEvent.value && eventForm.id) {
      await $trpc.events.update.mutate({
        id: eventForm.id,
        ...payload,
      });
      showToast(`Event "${payload.title.en}" updated successfully!`);
    } else {
      await $trpc.events.create.mutate(payload);
      showToast(`Event "${payload.title.en}" created successfully!`);
    }

    isEventModalOpen.value = false;
    await fetchEventsData();
  } catch (err: any) {
    showToast(err?.message || "Failed to save event", "error");
  } finally {
    savingEvent.value = false;
  }
};

// Delete state
const deleteConfirmEvent = ref<FormattedEventItem | null>(null);
const deletingEvent = ref(false);

const confirmDeleteEvent = (item: FormattedEventItem) => {
  deleteConfirmEvent.value = item;
};

const executeDeleteEvent = async () => {
  if (!deleteConfirmEvent.value) return;

  deletingEvent.value = true;
  try {
    await $trpc.events.delete.mutate({ id: deleteConfirmEvent.value.id });
    showToast(`Event "${deleteConfirmEvent.value.title.en}" deleted successfully!`);
    deleteConfirmEvent.value = null;
    await fetchEventsData();
  } catch (err: any) {
    showToast(err?.message || "Failed to delete event", "error");
  } finally {
    deletingEvent.value = false;
  }
};
</script>

<template>
  <div v-if="isPending" class="admin-auth-loading">
    <div class="admin-auth-spinner"></div>
    <span class="admin-auth-text">Verifying administrative access...</span>
  </div>

  <div v-else class="admin-layout">
    <!-- TOAST NOTIFICATION -->
    <transition name="toast-fade">
      <div v-if="toast.show" class="admin-toast" :class="`toast-${toast.type}`">
        
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
          
          <div class="logo-text">
            <span class="brand-title">SANCTUM</span>
            <span class="brand-tag">{{ isAdmin ? 'Admin Console' : 'Editor Console' }}</span>
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

      <!-- Navigation Links Groups -->
      <nav class="sidebar-nav" aria-label="Admin Navigation">
        <div v-for="group in navGroups" :key="group.title" class="nav-group">
          <div class="nav-group-title">{{ group.title }}</div>
          <ul class="nav-list">
            <li v-for="item in group.items" :key="item.id">
              <button
                type="button"
                class="nav-item-btn"
                :class="{ 'item-active': activeModule === item.id }"
                @click="activeModule = item.id as any; isSidebarOpen = false"
              >
                <span class="item-label">{{ item.label }}</span>
                <span v-if="item.badge" class="item-badge" :class="{ 'badge-alert': item.id === 'bookings' && newBookingsCount > 0 }">
                  {{ item.badge }}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Sidebar User Profile & Logout -->
      <div class="sidebar-user-footer">
        <div class="user-info">
          <div class="user-avatar-circle">
            {{ (currentUser?.name || "Admin").slice(0, 2).toUpperCase() }}
          </div>
          <div class="user-details">
            <span class="user-name">{{ currentUser?.name || "Sanctum User" }}</span>
            <span class="user-role-badge" :class="isAdmin ? 'role-admin' : 'role-editor'">
              {{ isAdmin ? "Super Admin" : "Content Editor" }}
            </span>
          </div>
        </div>

        <button type="button" class="btn-logout" @click="() => logout()" title="Sign out of console">
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
            <span>Menu</span>
          </button>

          <div class="breadcrumb">
            <span class="crumb-root">Sanctum</span>
            <span class="crumb-sep">/</span>
            <span class="crumb-active">
              {{
                activeModule === 'dashboard' ? 'Overview' :
                activeModule === 'schedule' ? 'Daily Schedule' :
                activeModule === 'pujas' ? 'Pujas & Services' :
                activeModule === 'events' ? 'Festivals & Events' :
                activeModule === 'deities' ? 'Deities & Shrines' :
                activeModule === 'notices' ? 'Temple Notices' : activeModule === 'bookings' ? 'Puja Bookings' : activeModule === 'messages' ? 'Contact Messages' : 'About Page Content'
              }}
            </span>
          </div>
        </div>

        <div class="topbar-right">
          <!-- Notification Bell Shortcut to Bookings -->
          <button
            type="button"
            class="topbar-notifications-btn"
            title="Bookings Notifications"
            @click="activeModule = 'bookings'"
          >
            <span>Bookings</span>
            <span v-if="newBookingsCount > 0" class="topbar-badge">{{ newBookingsCount }}</span>
          </button>

          <!-- Contact Messages Shortcut -->
          <button
            type="button"
            class="topbar-notifications-btn"
            title="Contact Inquiries"
            @click="activeModule = 'messages'"
          >
            <span>Messages</span>
            <span v-if="newMessagesCount > 0" class="topbar-badge">{{ newMessagesCount }}</span>
          </button>

          <!-- Status Pill -->
          <div class="status-pill">
            <span class="status-dot"></span>
            <span>Live</span>
          </div>

          <!-- Public site shortcut -->
          <NuxtLink to="/" target="_blank" class="btn-live-site">
            <span>View Site</span>
            
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
            <!-- 1. Daily Schedule -->
            <div class="kpi-card" @click="activeModule = 'schedule'">
              <div class="kpi-content">
                <span class="kpi-label">Daily Aartis & Pujas</span>
                <span class="kpi-val">{{ totalRitualsCount }}</span>
                <span class="kpi-trend">
                  <span class="trend-up">{{ activeRitualsCount }} Active</span> • {{ hiddenRitualsCount }} Hidden
                </span>
              </div>
            </div>

            <!-- 2. Pujas & Services -->
            <div class="kpi-card" @click="activeModule = 'pujas'">
              <div class="kpi-content">
                <span class="kpi-label">Pujas & Services</span>
                <span class="kpi-val">{{ totalPujasCount }}</span>
                <span class="kpi-trend">
                  <span class="trend-up">{{ activePujasCount }} Active</span> • {{ bookablePujasCount }} Bookable
                </span>
              </div>
            </div>

            <!-- 3. Festivals & Events -->
            <div class="kpi-card" @click="activeModule = 'events'">
              <div class="kpi-content">
                <span class="kpi-label">Festivals & Events</span>
                <span class="kpi-val">{{ upcomingEventsCount }} <span class="text-xs font-normal text-muted">Upcoming</span></span>
                <span class="kpi-trend">
                  <span class="trend-purple font-medium">{{ totalEventsCount }} Total</span> • {{ festivalsCount }} Festivals
                </span>
              </div>
            </div>

            <!-- 4. Deities & Shrines -->
            <div class="kpi-card" @click="activeModule = 'deities'">
              <div class="kpi-content">
                <span class="kpi-label">Deities & Shrines</span>
                <span class="kpi-val">{{ totalDeitiesCount }}</span>
                <span class="kpi-trend">
                  <span class="trend-up">{{ activeDeitiesCount }} Active</span> • {{ hiddenDeitiesCount }} Hidden
                </span>
              </div>
            </div>

            <!-- 5. Temple Notices -->
            <div class="kpi-card" @click="activeModule = 'notices'">
              <div class="kpi-content">
                <span class="kpi-label">Temple Notices</span>
                <span class="kpi-val">{{ totalNoticesCount }}</span>
                <span class="kpi-trend">
                  <span class="trend-up">{{ pinnedNoticesCount }} Pinned</span> • {{ activeNoticesCount }} Active
                </span>
              </div>
            </div>

            <!-- 6. Puja Bookings -->
            <div class="kpi-card" @click="activeModule = 'bookings'">
              <div class="kpi-content">
                <span class="kpi-label">Puja Bookings</span>
                <span class="kpi-val">{{ totalBookingsCount }}</span>
                <span class="kpi-trend">
                  <span v-if="newBookingsCount > 0" class="trend-amber font-bold">{{ newBookingsCount }} New Requests</span>
                  <span v-else class="text-green-400">All Requests Handled</span>
                </span>
              </div>
            </div>
            <!-- 7. Contact Inquiries -->
            <div class="kpi-card" @click="activeModule = 'messages'">
              <div class="kpi-content">
                <span class="kpi-label">Contact Messages</span>
                <span class="kpi-val">{{ totalMessagesCount }}</span>
                <span class="kpi-trend">
                  <span v-if="newMessagesCount > 0" class="trend-amber font-bold">{{ newMessagesCount }} New Inquiries</span>
                  <span v-else class="text-green-400">All Inquiries Handled</span>
                </span>
              </div>
            </div>

            <!-- 7. Next Aarti -->
            <div class="kpi-card">
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
          </div>

          <!-- Quick Navigation Panel -->
          <div class="dash-panel">
            <div class="panel-head">
              <h2 class="panel-title">Sanctum Operations</h2>
              <span class="panel-tag">Quick Actions</span>
            </div>
            <div class="quick-actions-grid">
              <button type="button" class="action-btn" @click="activeModule = 'schedule'">
                <span>Manage Daily Schedule</span>
              </button>
              <button type="button" class="action-btn" @click="activeModule = 'pujas'">
                <span>Manage Pujas & Services</span>
              </button>
              <button type="button" class="action-btn" @click="activeModule = 'events'">
                <span>Festivals & Events</span>
              </button>
              <button type="button" class="action-btn" @click="activeModule = 'deities'">
                <span>Manage Deities & Shrines</span>
              </button>
              <button type="button" class="action-btn" @click="activeModule = 'notices'">
                <span>Notice Board</span>
              </button>
              <button type="button" class="action-btn" @click="activeModule = 'bookings'">
                <span>Review Puja Bookings</span>
              </button>
              <button type="button" class="action-btn" @click="activeModule = 'messages'">
                <span>Contact Inquiries</span>
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
                Refresh
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
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    class="btn-action-del"
                    title="Delete ritual"
                    @click="confirmDelete(item)"
                  >
                    <span>Delete</span>
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
              <NuxtLink to="/puja-and-rituals" target="_blank" class="btn-refresh" title="View live puja & rituals page">
                View Public Page
              </NuxtLink>
              <button type="button" class="btn-refresh" @click="fetchPujasData" title="Refresh pujas list">
                Refresh
              </button>
              <button type="button" class="btn-add-primary" @click="openAddPujaModal">
                <span>+ Add Puja Offering</span>
              </button>
            </div>
          </div>

          <!-- Filters Bar -->
          <div class="filters-bar">
            <div class="search-box">
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
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    class="btn-action-del"
                    title="Delete puja offering"
                    @click="confirmDeletePuja(item)"
                  >
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- TAB 4: FESTIVALS & EVENTS CRUD MANAGER                          -->
        <!-- =============================================================== -->
        <div v-else-if="activeModule === 'events'" class="tab-pane">
          <!-- Module Header -->
          <div class="module-header-row">
            <div>
              <h1 class="module-title">Festivals & Sacred Calendar</h1>
              <p class="module-subtitle">
                Publish and schedule temple festivals, special pujas, auspicious tithis, and seva events for devotees.
              </p>
            </div>
            <div class="module-header-actions">
              <NuxtLink to="/festivals-and-events" target="_blank" class="btn-refresh" title="View live festivals & events page">
                View Public Page
              </NuxtLink>
              <button type="button" class="btn-refresh" @click="fetchEventsData" title="Refresh events list">
                Refresh
              </button>
              <button type="button" class="btn-add-primary" @click="openAddEventModal">
                <span>+ Add Event / Festival</span>
              </button>
            </div>
          </div>

          <!-- Filters Bar -->
          <div class="filters-bar">
            <div class="search-box">
              <input
                type="text"
                v-model="eventSearchQuery"
                class="search-input"
                placeholder="Search events by title, tithi, slug, or details..."
              />
              <button v-if="eventSearchQuery" class="clear-search-btn" @click="eventSearchQuery = ''">&times;</button>
            </div>

            <div class="filter-pills">
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': eventFilter === 'all' }"
                @click="eventFilter = 'all'"
              >
                All ({{ totalEventsCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': eventFilter === 'upcoming' }"
                @click="eventFilter = 'upcoming'"
              >
                Upcoming ({{ upcomingEventsCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': eventFilter === 'festival' }"
                @click="eventFilter = 'festival'"
              >
                Festivals ({{ festivalsCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': eventFilter === 'special_puja' }"
                @click="eventFilter = 'special_puja'"
              >
                Special Pujas
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': eventFilter === 'seva' }"
                @click="eventFilter = 'seva'"
              >
                Seva
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': eventFilter === 'active' }"
                @click="eventFilter = 'active'"
              >
                Active ({{ activeEventsCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': eventFilter === 'hidden' }"
                @click="eventFilter = 'hidden'"
              >
                Hidden ({{ hiddenEventsCount }})
              </button>
            </div>
          </div>

          <!-- Events Table / Card List -->
          <div class="schedule-table-card">
            <div v-if="loadingEvents" class="loading-state">
              <div class="spinner"></div>
              <span>Loading temple events from Sanctum database...</span>
            </div>

            <div v-else-if="filteredEvents.length === 0" class="empty-state">
              <h3 class="empty-title">No events or festivals found</h3>
              <p class="empty-desc">
                {{ eventSearchQuery ? 'No calendar entries match your search query.' : 'No festivals or events have been scheduled yet.' }}
              </p>
              <button type="button" class="btn-add-primary" @click="openAddEventModal">
                <span>+ Add First Festival / Event</span>
              </button>
            </div>

            <div v-else class="event-items-list">
              <div
                v-for="item in filteredEvents"
                :key="item.id"
                class="event-row-item"
                :class="{ 'item-inactive': !item.active }"
              >
                <!-- Date, Kind & Time Meta Col -->
                <div class="event-meta-col">
                  <span class="event-date-badge">{{ item.date }}</span>
                  <span v-if="item.date >= getDhakaToday()" class="event-upcoming-tag">UPCOMING</span>
                  <span v-else class="event-past-tag">PAST</span>
                  <span class="event-kind-tag" :class="`kind-${item.kind}`">
                    {{
                      item.kind === 'festival' ? 'Festival' :
                      item.kind === 'special_puja' ? 'Special Puja' :
                      item.kind === 'seva' ? 'Seva' : 'Other'
                    }}
                  </span>
                  <span v-if="item.time" class="event-time-tag">{{ item.time }}</span>
                </div>

                <!-- Title, Tithi, Slug & Description Col -->
                <div class="event-details-col">
                  <div class="title-row">
                    <h3 class="event-title-en">{{ item.title.en }}</h3>
                    <span v-if="item.title.bn" class="event-title-bn">{{ item.title.bn }}</span>
                    <span v-if="item.label?.en || item.label?.bn" class="event-tithi-chip" :title="item.label.bn || item.label.en">
                      {{ item.label.en || item.label.bn }}
                    </span>
                    <span class="event-slug-pill">/{{ item.slug }}</span>
                  </div>
                  <p class="event-desc-en">{{ item.description.en }}</p>
                  <p v-if="item.description.bn" class="event-desc-bn">{{ item.description.bn }}</p>
                </div>

                <!-- Active Toggle Switch Col -->
                <div class="event-controls-col">
                  <div class="mini-toggle-row">
                    <label class="switch-toggle" :title="item.active ? 'Click to hide from public site' : 'Click to show on public site'">
                      <input
                        type="checkbox"
                        :checked="item.active"
                        @change="toggleEventActive(item)"
                      />
                      <span class="switch-slider round"></span>
                    </label>
                    <span class="status-caption" :class="item.active ? 'caption-active' : 'caption-hidden'">
                      {{ item.active ? 'Active' : 'Hidden' }}
                    </span>
                  </div>
                </div>

                <!-- Action Buttons Col -->
                <div class="actions-col">
                  <button
                    type="button"
                    class="btn-action-edit"
                    title="Edit festival or event"
                    @click="openEditEventModal(item)"
                  >
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    class="btn-action-del"
                    title="Delete festival or event"
                    @click="confirmDeleteEvent(item)"
                  >
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- TAB 5: DEITIES & SHRINES CRUD MANAGER                           -->
        <!-- =============================================================== -->
        <div v-else-if="activeModule === 'deities'" class="tab-pane">
          <!-- Module Header -->
          <div class="module-header-row">
            <div>
              <h1 class="module-title">Deities & Sacred Shrines</h1>
              <p class="module-subtitle">
                Manage temple deity profiles, sacred history, divine attributes, darshan images, and display sequencing.
              </p>
            </div>
            <div class="module-header-actions">
              <NuxtLink to="/deities" target="_blank" class="btn-refresh" title="View live deities page on public site">
                View Public Page
              </NuxtLink>
              <button type="button" class="btn-refresh" @click="fetchDeitiesData" title="Refresh deities list">
                Refresh
              </button>
              <button type="button" class="btn-add-primary" @click="openAddDeityModal">
                <span>+ Add Deity Profile</span>
              </button>
            </div>
          </div>

          <!-- Filters Bar -->
          <div class="filters-bar">
            <div class="search-box">
              <input
                type="text"
                v-model="deitySearchQuery"
                class="search-input"
                placeholder="Search deities by name, subtitle, description, or slug..."
              />
              <button v-if="deitySearchQuery" class="clear-search-btn" @click="deitySearchQuery = ''">&times;</button>
            </div>

            <div class="filter-pills">
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': deityFilter === 'all' }"
                @click="deityFilter = 'all'"
              >
                All ({{ totalDeitiesCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': deityFilter === 'active' }"
                @click="deityFilter = 'active'"
              >
                Active ({{ activeDeitiesCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': deityFilter === 'hidden' }"
                @click="deityFilter = 'hidden'"
              >
                Hidden ({{ hiddenDeitiesCount }})
              </button>
            </div>
          </div>

          <!-- Deities Table / Card List -->
          <div class="schedule-table-card">
            <div v-if="loadingDeities" class="loading-state">
              <div class="spinner"></div>
              <span>Loading sacred deity profiles from Sanctum database...</span>
            </div>

            <div v-else-if="filteredDeities.length === 0" class="empty-state">
              <h3 class="empty-title">No deities found</h3>
              <p class="empty-desc">
                {{ deitySearchQuery ? 'No deities match your search filter.' : 'No deities have been configured yet.' }}
              </p>
              <button type="button" class="btn-add-primary" @click="openAddDeityModal">
                <span>+ Add First Deity</span>
              </button>
            </div>

            <div v-else class="deity-items-list">
              <div
                v-for="(item, idx) in filteredDeities"
                :key="item.id"
                class="deity-row-item"
                :class="{ 'item-inactive': !item.active }"
              >
                <!-- Reorder Controls -->
                <div class="reorder-col">
                  <button
                    type="button"
                    class="btn-reorder"
                    :disabled="idx === 0"
                    title="Move higher"
                    @click="moveDeityOrder(idx, 'up')"
                  >
                    ▲
                  </button>
                  <span class="sort-order-num">{{ item.sortOrder }}</span>
                  <button
                    type="button"
                    class="btn-reorder"
                    :disabled="idx === filteredDeities.length - 1"
                    title="Move lower"
                    @click="moveDeityOrder(idx, 'down')"
                  >
                    ▼
                  </button>
                </div>

                <!-- Deity Avatar / Icon -->
                <div class="deity-avatar-col">
                  <img
                    v-if="item.imageId && (item.imageId.startsWith('http') || item.imageId.startsWith('/'))"
                    :src="item.imageId"
                    :alt="item.name.en"
                    class="deity-avatar-img"
                  />
                  <div v-else class="deity-avatar-placeholder">
                    <span>{{ item.name.en?.slice(0, 1) || 'D' }}</span>
                  </div>
                </div>

                <!-- Details Column -->
                <div class="deity-details-col">
                  <div class="title-row">
                    <h3 class="deity-title-en">{{ item.name.en }}</h3>
                    <span v-if="item.name.bn" class="deity-title-bn">{{ item.name.bn }}</span>
                    <span class="deity-slug-pill">/{{ item.slug }}</span>
                  </div>
                  <div v-if="item.subtitle?.en || item.subtitle?.bn" class="deity-sub-row">
                    <span class="deity-subtitle-text">{{ item.subtitle?.en }}</span>
                    <span v-if="item.subtitle?.bn" class="deity-subtitle-bn">({{ item.subtitle?.bn }})</span>
                  </div>
                  <p class="deity-desc-en">{{ item.description.en }}</p>
                  <p v-if="item.description.bn" class="deity-desc-bn">{{ item.description.bn }}</p>
                </div>

                <!-- Active Toggle -->
                <div class="toggle-col">
                  <label class="switch-toggle" :title="item.active ? 'Click to hide from public' : 'Click to make active'">
                    <input
                      type="checkbox"
                      :checked="item.active"
                      @change="toggleDeityActiveStatus(item)"
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
                    title="Edit deity details"
                    @click="openEditDeityModal(item)"
                  >
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    class="btn-action-del"
                    title="Delete deity"
                    @click="confirmDeleteDeity(item)"
                  >
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- TAB 6: TEMPLE NOTICES CRUD MANAGER                             -->
        <!-- =============================================================== -->
        <div v-else-if="activeModule === 'notices'" class="tab-pane">
          <!-- Module Header -->
          <div class="module-header-row">
            <div>
              <h1 class="module-title">Temple Notice Board</h1>
              <p class="module-subtitle">
                Publish and manage mandir announcements, puja guidelines, and official circulars for the temple website.
              </p>
            </div>
            <div class="module-header-actions">
              <NuxtLink to="/notice-news" target="_blank" class="btn-refresh" title="View live temple notices page">
                View Public Page
              </NuxtLink>
              <button type="button" class="btn-refresh" @click="fetchNoticesData" title="Refresh notices list">
                Refresh
              </button>
              <button type="button" class="btn-add-primary" @click="openAddNoticeModal">
                <span>+ Publish Notice</span>
              </button>
            </div>
          </div>

          <!-- Filters Bar -->
          <div class="filters-bar">
            <div class="search-box">
              <input
                type="text"
                v-model="noticeSearchQuery"
                class="search-input"
                placeholder="Search notices by title, category, or body text..."
              />
              <button v-if="noticeSearchQuery" class="clear-search-btn" @click="noticeSearchQuery = ''">&times;</button>
            </div>

            <div class="filter-pills">
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': noticeFilter === 'all' }"
                @click="noticeFilter = 'all'"
              >
                All ({{ totalNoticesCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': noticeFilter === 'pinned' }"
                @click="noticeFilter = 'pinned'"
              >
                Pinned ({{ pinnedNoticesCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': noticeFilter === 'active' }"
                @click="noticeFilter = 'active'"
              >
                Active ({{ activeNoticesCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': noticeFilter === 'hidden' }"
                @click="noticeFilter = 'hidden'"
              >
                Hidden
              </button>
            </div>
          </div>

          <!-- Category Pills -->
          <div class="category-pills-row">
            <span class="category-label">Category Filter:</span>
            <button
              v-for="cat in noticeCategories"
              :key="cat.id"
              type="button"
              class="cat-chip"
              :class="{ 'cat-chip-active': noticeCategoryFilter === cat.id }"
              @click="noticeCategoryFilter = cat.id"
            >
              {{ cat.label }}
            </button>
          </div>

          <!-- Notices Table / Card List -->
          <div class="schedule-table-card">
            <div v-if="loadingNotices" class="loading-state">
              <div class="spinner"></div>
              <span>Loading notice board entries from Sanctum database...</span>
            </div>

            <div v-else-if="filteredNotices.length === 0" class="empty-state">
              <h3 class="empty-title">No notices found</h3>
              <p class="empty-desc">
                {{ noticeSearchQuery ? 'No notices match your search filter.' : 'No notices have been published yet.' }}
              </p>
              <button type="button" class="btn-add-primary" @click="openAddNoticeModal">
                <span>+ Publish First Notice</span>
              </button>
            </div>

            <div v-else class="notice-items-list">
              <div
                v-for="item in filteredNotices"
                :key="item.id"
                class="notice-row-item"
                :class="{ 'item-pinned': item.pinned, 'item-inactive': !item.active }"
              >
                <!-- Notice Date & Category Col -->
                <div class="notice-meta-col">
                  <span class="notice-date-badge">{{ item.date }}</span>
                  <span class="notice-cat-tag">{{ item.category }}</span>
                  <span v-if="item.pinned" class="pinned-indicator-chip">PINNED</span>
                </div>

                <!-- Notice Content Col -->
                <div class="notice-details-col">
                  <div class="title-row">
                    <h3 class="notice-title-en">{{ item.title.en }}</h3>
                    <span v-if="item.title.bn" class="notice-title-bn">{{ item.title.bn }}</span>
                    <span class="notice-slug-pill">/{{ item.slug }}</span>
                  </div>
                  <p class="notice-body-en">{{ item.body.en }}</p>
                  <p v-if="item.body.bn" class="notice-body-bn">{{ item.body.bn }}</p>
                </div>

                <!-- Toggles Col (Pin & Active) -->
                <div class="notice-controls-col">
                  <!-- Pin Button -->
                  <button
                    type="button"
                    class="btn-pin-toggle"
                    :class="{ 'pin-active': item.pinned }"
                    :title="item.pinned ? 'Click to unpin' : 'Click to pin to top of notice board'"
                    @click="toggleNoticePinnedStatus(item)"
                  >
                    <span>{{ item.pinned ? 'Pinned' : 'Pin' }}</span>
                  </button>

                  <!-- Active Toggle -->
                  <div class="mini-toggle-row">
                    <label class="switch-toggle" :title="item.active ? 'Click to hide' : 'Click to show'">
                      <input
                        type="checkbox"
                        :checked="item.active"
                        @change="toggleNoticeActiveStatus(item)"
                      />
                      <span class="switch-slider round"></span>
                    </label>
                    <span class="status-caption" :class="item.active ? 'caption-active' : 'caption-hidden'">
                      {{ item.active ? 'Active' : 'Hidden' }}
                    </span>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="actions-col">
                  <button
                    type="button"
                    class="btn-action-edit"
                    title="Edit notice"
                    @click="openEditNoticeModal(item)"
                  >
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    class="btn-action-del"
                    title="Delete notice"
                    @click="confirmDeleteNotice(item)"
                  >
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- TAB 7: PUJA BOOKINGS MANAGER                                    -->
        <!-- =============================================================== -->
        <div v-else-if="activeModule === 'bookings'" class="tab-pane">
          <!-- Module Header -->
          <div class="module-header-row">
            <div>
              <h1 class="module-title">Devotee Puja Booking Requests</h1>
              <p class="module-subtitle">
                Review and process puja booking requests submitted by devotees online. Confirm dates, record priest notes, and update statuses.
              </p>
            </div>
            <div class="module-header-actions">
              <button type="button" class="btn-refresh" @click="fetchBookingsData" title="Refresh bookings list">
                Refresh
              </button>
            </div>
          </div>

          <!-- Filters Bar -->
          <div class="filters-bar">
            <div class="search-box">
              <input
                type="text"
                v-model="bookingSearchQuery"
                class="search-input"
                placeholder="Search by devotee name, phone, ref code, or gotra..."
              />
              <button v-if="bookingSearchQuery" class="clear-search-btn" @click="bookingSearchQuery = ''">&times;</button>
            </div>

            <div class="filter-pills">
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': bookingStatusFilter === 'all' }"
                @click="bookingStatusFilter = 'all'"
              >
                All ({{ totalBookingsCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': bookingStatusFilter === 'new' }"
                @click="bookingStatusFilter = 'new'"
              >
                New ({{ newBookingsCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': bookingStatusFilter === 'confirmed' }"
                @click="bookingStatusFilter = 'confirmed'"
              >
                Confirmed ({{ confirmedBookingsCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': bookingStatusFilter === 'completed' }"
                @click="bookingStatusFilter = 'completed'"
              >
                Completed ({{ completedBookingsCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': bookingStatusFilter === 'cancelled' }"
                @click="bookingStatusFilter = 'cancelled'"
              >
                Cancelled ({{ cancelledBookingsCount }})
              </button>
            </div>
          </div>

          <!-- Bookings Table / Card List -->
          <div class="schedule-table-card">
            <div v-if="loadingBookings" class="loading-state">
              <div class="spinner"></div>
              <span>Loading puja bookings from Sanctum database...</span>
            </div>

            <div v-else-if="filteredBookings.length === 0" class="empty-state">
              <h3 class="empty-title">No booking requests found</h3>
              <p class="empty-desc">
                {{ bookingSearchQuery ? 'No booking records match your search filter.' : 'No devotee puja bookings in this category.' }}
              </p>
            </div>

            <div v-else class="booking-items-list">
              <div
                v-for="item in filteredBookings"
                :key="item.id"
                class="booking-row-item"
                :class="`booking-status-${item.status}`"
              >
                <!-- Reference Badge & Date Col -->
                <div class="booking-ref-col">
                  <span class="booking-ref-pill">{{ item.ref }}</span>
                  <span class="booking-created-date">Submitted: {{ new Date(item.createdAt).toLocaleDateString() }}</span>
                </div>

                <!-- Devotee Contact Info Col -->
                <div class="booking-devotee-col">
                  <div class="devotee-name-row">
                    <span class="devotee-name">{{ item.name }}</span>
                    <span v-if="item.gotra" class="devotee-gotra">Gotra: {{ item.gotra }}</span>
                  </div>
                  <div class="devotee-contact-row">
                    <a :href="`tel:${item.phone}`" class="contact-link phone-link">{{ item.phone }}</a>
                    <a v-if="item.email" :href="`mailto:${item.email}`" class="contact-link email-link">{{ item.email }}</a>
                  </div>
                </div>

                <!-- Puja Details & Preferred Date Col -->
                <div class="booking-puja-col">
                  <div class="puja-booked-badge">
                    <span class="puja-booked-name">{{ item.pujaName?.en || 'Puja / Sacred Sankalpa' }}</span>
                    <span v-if="item.pujaPrice" class="puja-booked-price">৳{{ item.pujaPrice }}</span>
                  </div>
                  <div class="preferred-date-chip">
                    <span>Preferred Date:</span>
                    <strong>{{ item.preferredDate }}</strong>
                  </div>
                  <div v-if="item.note" class="devotee-note-box">
                    <span class="note-quote">“{{ item.note }}”</span>
                  </div>
                </div>

                <!-- Status & Admin Notes Col -->
                <div class="booking-status-col">
                  <span class="booking-status-pill" :class="`pill-${item.status}`">
                    {{ item.status.toUpperCase() }}
                  </span>
                  <span v-if="item.handledBy" class="handled-by-text">By: {{ item.handledBy }}</span>
                  <div v-if="item.adminNote" class="admin-note-preview" :title="item.adminNote">
                    <span>Note: {{ item.adminNote }}</span>
                  </div>
                </div>

                <!-- Workflow Actions Col -->
                <div class="booking-actions-col">
                  <!-- Quick Status Actions -->
                  <button
                    v-if="item.status === 'new'"
                    type="button"
                    class="btn-booking-confirm"
                    title="Confirm this booking request"
                    @click="changeBookingStatus(item, 'confirmed')"
                  >
                    Confirm
                  </button>

                  <button
                    v-if="item.status === 'confirmed'"
                    type="button"
                    class="btn-booking-complete"
                    title="Mark ritual as completed"
                    @click="changeBookingStatus(item, 'completed')"
                  >
                    Complete
                  </button>

                  <button
                    v-if="item.status !== 'cancelled' && item.status !== 'completed'"
                    type="button"
                    class="btn-booking-cancel"
                    title="Cancel booking"
                    @click="changeBookingStatus(item, 'cancelled')"
                  >
                    Cancel
                  </button>

                  <!-- Internal Note Button -->
                  <button
                    type="button"
                    class="btn-booking-note"
                    title="Add / edit priest admin note"
                    @click="openBookingNoteModal(item)"
                  >
                    Note
                  </button>

                  <!-- Delete (Admin) -->
                  <button
                    v-if="isAdmin"
                    type="button"
                    class="btn-action-del"
                    title="Delete record"
                    @click="confirmDeleteBooking(item)"
                  >
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <!-- =============================================================== -->
        <!-- TAB 9: ABOUT PAGE CONTENT CMS                                   -->
        <!-- =============================================================== -->
        <div v-else-if="activeModule === 'about_cms'" class="tab-pane">
          <!-- Module Header -->
          <div class="module-header-row">
            <div>
              <h1 class="module-title">About Us Page Customizer</h1>
              <p class="module-subtitle">
                Customize the sacred history, hero narrative, spiritual pillars, and pilgrim guidelines displayed on the public About page.
              </p>
            </div>
            <div class="module-header-actions">
              <button
                type="button"
                class="btn-refresh"
                :disabled="savingAboutCms"
                @click="resetAboutCms"
                title="Reset to default temple text"
              >
                Reset Defaults
              </button>
              <button
                type="button"
                class="btn-primary"
                :disabled="savingAboutCms"
                @click="saveAboutCms"
              >
                <span>{{ savingAboutCms ? 'Saving...' : 'Save About Page' }}</span>
              </button>
            </div>
          </div>

          <!-- Loading state -->
          <div v-if="loadingAboutCms" class="schedule-table-card">
            <div class="loading-state">
              <div class="spinner"></div>
              <span>Loading About page content from database...</span>
            </div>
          </div>

          <form v-else class="cms-form-stack" @submit.prevent="saveAboutCms">
            <!-- 1. HERO BANNER CARD -->
            <div class="cms-card">
              <div class="cms-card-header">
                <h2 class="cms-card-title">1. Hero Section &amp; Titles</h2>
                <span class="cms-card-sub">Top banner and introduction on the About page</span>
              </div>
              <div class="cms-card-body">
                <div class="form-group mb-3">
                  <label class="form-label">Banner Badge Text</label>
                  <input
                    v-model="aboutCmsData.hero.badge"
                    type="text"
                    class="form-input"
                    placeholder="e.g. Sacred Abode of Divine Mother · Established Heritage"
                  />
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Page Title</label>
                  <input
                    v-model="aboutCmsData.hero.title"
                    type="text"
                    class="form-input font-bold"
                  />
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Hero Subtitle / Narrative</label>
                  <textarea
                    v-model="aboutCmsData.hero.subtitle"
                    rows="3"
                    class="form-textarea"
                  ></textarea>
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Established Note / Heritage Tagline</label>
                  <input
                    v-model="aboutCmsData.hero.establishedText"
                    type="text"
                    class="form-input"
                  />
                </div>
              </div>
            </div>

            <!-- 2. SACRED HISTORY & LORE CARD -->
            <div class="cms-card">
              <div class="cms-card-header">
                <h2 class="cms-card-title">2. Sacred History &amp; Narrative</h2>
                <span class="cms-card-sub">Historical background, sacred quote, and story paragraphs</span>
              </div>
              <div class="cms-card-body">
                <div class="form-group mb-3">
                  <label class="form-label">History Section Heading</label>
                  <input
                    v-model="aboutCmsData.history.heading"
                    type="text"
                    class="form-input"
                  />
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Sacred Pull Quote</label>
                  <textarea
                    v-model="aboutCmsData.history.quote"
                    rows="2"
                    class="form-textarea"
                  ></textarea>
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Quote Attribution</label>
                  <input
                    v-model="aboutCmsData.history.quoteAuthor"
                    type="text"
                    class="form-input"
                  />
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">History Paragraphs</label>
                  <div
                    v-for="(para, idx) in aboutCmsData.history.narrativeParagraphs"
                    :key="idx"
                    class="mb-2"
                  >
                    <label class="text-xs font-bold text-muted mb-1 block">Paragraph {{ idx + 1 }}</label>
                    <textarea
                      v-model="aboutCmsData.history.narrativeParagraphs[idx]"
                      rows="3"
                      class="form-textarea"
                    ></textarea>
                  </div>
                </div>

                <!-- Historical Milestones -->
                <div class="form-group mb-3">
                  <label class="form-label">Historical Milestones</label>
                  <div
                    v-for="(milestone, idx) in aboutCmsData.history.milestones"
                    :key="idx"
                    class="p-3 border rounded mb-2"
                    style="border: 1px solid var(--adm-border); border-radius: 6px; padding: 0.75rem;"
                  >
                    <div class="grid-2-cols mb-2">
                      <div class="form-group">
                        <label class="text-xs font-bold text-muted">Period</label>
                        <input v-model="milestone.period" type="text" class="form-input" />
                      </div>
                      <div class="form-group">
                        <label class="text-xs font-bold text-muted">Title</label>
                        <input v-model="milestone.title" type="text" class="form-input font-bold" />
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="text-xs font-bold text-muted">Description</label>
                      <textarea v-model="milestone.description" rows="2" class="form-textarea"></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. ADMINISTRATION & TRUST -->
            <div class="cms-card">
              <div class="cms-card-header">
                <h2 class="cms-card-title">3. Temple Governance &amp; Trust Information</h2>
                <span class="cms-card-sub">Governing council, responsibilities, and registration</span>
              </div>
              <div class="cms-card-body">
                <div class="form-group mb-3">
                  <label class="form-label">Section Title</label>
                  <input
                    v-model="aboutCmsData.administration.title"
                    type="text"
                    class="form-input"
                  />
                </div>
                <div class="form-group mb-3">
                  <label class="form-label">Committee Name</label>
                  <input
                    v-model="aboutCmsData.administration.committeeName"
                    type="text"
                    class="form-input font-bold"
                  />
                </div>
                <div class="form-group mb-3">
                  <label class="form-label">Governance Overview</label>
                  <textarea
                    v-model="aboutCmsData.administration.description"
                    rows="3"
                    class="form-textarea"
                  ></textarea>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label">Key Responsibilities</label>
                  <div
                    v-for="(resp, idx) in aboutCmsData.administration.keyResponsibilities"
                    :key="idx"
                    class="mb-2"
                  >
                    <input
                      v-model="aboutCmsData.administration.keyResponsibilities[idx]"
                      type="text"
                      class="form-input"
                    />
                  </div>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label">Registration / Trust Badge Text</label>
                  <input
                    v-model="aboutCmsData.administration.registrationInfo"
                    type="text"
                    class="form-input"
                  />
                </div>
              </div>
            </div>

            <!-- Save Action Button Bottom -->
            <div class="module-header-actions mt-4 pb-4">
              <button
                type="submit"
                class="btn-primary"
                :disabled="savingAboutCms"
              >
                <span>{{ savingAboutCms ? 'Saving Changes...' : 'Save About Page Content' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- =============================================================== -->
        <!-- TAB: GENERAL SITE SETTINGS                                      -->
        <!-- =============================================================== -->
        <div v-else-if="activeModule === 'site_settings'" class="tab-pane">
          <!-- Module Header -->
          <div class="module-header-row">
            <div>
              <h1 class="module-title">General Site Settings</h1>
              <p class="module-subtitle">
                Configure global typography, theme palettes, brand identity, favicon, social channels, and temple contact details.
              </p>
            </div>
            <div class="module-header-actions">
              <button
                type="button"
                class="btn-refresh"
                :disabled="savingSiteSettings"
                @click="resetSiteSettings"
                title="Reset all settings to temple defaults"
              >
                Reset Defaults
              </button>
              <button
                type="button"
                class="btn-primary"
                :disabled="savingSiteSettings"
                @click="saveSiteSettings"
              >
                <span>{{ savingSiteSettings ? 'Saving...' : 'Save Settings' }}</span>
              </button>
            </div>
          </div>

          <!-- Loading state -->
          <div v-if="loadingSiteSettings" class="schedule-table-card">
            <div class="loading-state">
              <div class="spinner"></div>
              <span>Loading site settings from database...</span>
            </div>
          </div>

          <form v-else class="cms-form-stack" @submit.prevent="saveSiteSettings">
            <!-- 1. BRAND IDENTITY & FAVICON -->
            <div class="cms-card">
              <div class="cms-card-header">
                <h2 class="cms-card-title">1. Brand Identity, Favicon &amp; Logos</h2>
                <span class="cms-card-sub">Site title, tagline, favicon path, and logo metadata</span>
              </div>
              <div class="cms-card-body">
                <div class="grid-2-cols mb-3">
                  <div class="form-group">
                    <label class="form-label">Mandir / Site Title *</label>
                    <input
                      v-model="siteSettingsData.brand.siteTitle"
                      type="text"
                      required
                      class="form-input"
                      placeholder="e.g. Golpahar Mohashoshan Kali Mandir"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Site Tagline / Slogan</label>
                    <input
                      v-model="siteSettingsData.brand.siteTagline"
                      type="text"
                      class="form-input"
                      placeholder="e.g. A Sacred Haven of Divine Worship, Peace & Heritage"
                    />
                  </div>
                </div>

                <div class="grid-2-cols mb-3">
                  <div class="form-group">
                    <label class="form-label">Favicon Path or URL</label>
                    <div class="input-with-preview">
                      <input
                        v-model="siteSettingsData.brand.faviconUrl"
                        type="text"
                        class="form-input"
                        placeholder="e.g. /favicon.ico"
                      />
                      <div class="preview-mini-badge" title="Favicon preview">
                        <img
                          v-if="siteSettingsData.brand.faviconUrl"
                          :src="siteSettingsData.brand.faviconUrl"
                          alt="Favicon preview"
                          class="favicon-preview-img"
                          @error="(e: any) => (e.target.style.display = 'none')"
                        />
                        <span v-else class="text-muted-mini">ico</span>
                      </div>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Main Logo Path or URL</label>
                    <input
                      v-model="siteSettingsData.brand.logoUrl"
                      type="text"
                      class="form-input"
                      placeholder="e.g. /images/temple-logo.svg"
                    />
                  </div>
                </div>

                <div class="form-group mb-0">
                  <label class="form-label">Footer Copyright Notice</label>
                  <input
                    v-model="siteSettingsData.brand.footerCopyright"
                    type="text"
                    class="form-input"
                    placeholder="e.g. © 2026 Golpahar Mohashoshan Kali Mandir Committee."
                  />
                </div>
              </div>
            </div>

            <!-- 2. TYPOGRAPHY & FONTS -->
            <div class="cms-card">
              <div class="cms-card-header">
                <h2 class="cms-card-title">2. Global Typography &amp; Fonts</h2>
                <span class="cms-card-sub">Choose typeface pairings for headings and body content</span>
              </div>
              <div class="cms-card-body">
                <div class="grid-3-cols mb-3">
                  <div class="form-group">
                    <label class="form-label">Heading Typeface</label>
                    <select v-model="siteSettingsData.typography.headingFont" class="form-select">
                      <option v-for="font in FONT_OPTIONS_HEADING" :key="font" :value="font">
                        {{ font }}
                      </option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Body Text Typeface</label>
                    <select v-model="siteSettingsData.typography.bodyFont" class="form-select">
                      <option v-for="font in FONT_OPTIONS_BODY" :key="font" :value="font">
                        {{ font }}
                      </option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Base Font Size</label>
                    <select v-model="siteSettingsData.typography.baseFontSize" class="form-select">
                      <option value="15px">Compact (15px)</option>
                      <option value="16px">Standard (16px - Recommended)</option>
                      <option value="17px">Comfortable (17px)</option>
                      <option value="18px">Large (18px)</option>
                    </select>
                  </div>
                </div>

                <!-- Live Typography Preview Card -->
                <div class="font-preview-box">
                  <span class="preview-tag">LIVE TYPEFACE SAMPLE</span>
                  <h3
                    class="font-preview-heading"
                    :style="{ fontFamily: siteSettingsData.typography.headingFont }"
                  >
                    জয় মা তারা জয় মা ভবতারিণী · Divine Sanctuary
                  </h3>
                  <p
                    class="font-preview-body"
                    :style="{
                      fontFamily: siteSettingsData.typography.bodyFont,
                      fontSize: siteSettingsData.typography.baseFontSize,
                    }"
                  >
                    Consecrated with sacred Vedic tradition and eternal devotion, the temple stands as a haven of peace, divine contemplation, and spiritual awakening in Chittagong.
                  </p>
                </div>
              </div>
            </div>

            <!-- 3. THEME & COLOR PALETTE -->
            <div class="cms-card">
              <div class="cms-card-header">
                <h2 class="cms-card-title">3. Theme Colors &amp; Sacred Palette</h2>
                <span class="cms-card-sub">Pick a consecrated preset or customize exact hex brand colors</span>
              </div>
              <div class="cms-card-body">
                <!-- Preset Palettes Selection -->
                <div class="form-group mb-4">
                  <label class="form-label">Preset Mandir Palettes</label>
                  <div class="palette-presets-grid">
                    <button
                      v-for="pal in THEME_PALETTES"
                      :key="pal.id"
                      type="button"
                      class="palette-preset-card"
                      :class="{ 'palette-selected': siteSettingsData.theme.colorPalette === pal.id }"
                      @click="applyPalettePreset(pal.id)"
                    >
                      <div class="palette-swatches">
                        <span class="swatch-circle" :style="{ backgroundColor: pal.primary }"></span>
                        <span class="swatch-circle" :style="{ backgroundColor: pal.secondary }"></span>
                        <span class="swatch-circle" :style="{ backgroundColor: pal.accent }"></span>
                        <span class="swatch-circle" :style="{ backgroundColor: pal.bg }"></span>
                      </div>
                      <span class="palette-card-name">{{ pal.name }}</span>
                    </button>
                  </div>
                </div>

                <!-- Color Inputs Row -->
                <div class="grid-4-cols mb-4">
                  <div class="form-group">
                    <label class="form-label">Primary Color</label>
                    <div class="color-picker-input-group">
                      <input
                        v-model="siteSettingsData.theme.primaryColor"
                        type="color"
                        class="color-swatch-input"
                      />
                      <input
                        v-model="siteSettingsData.theme.primaryColor"
                        type="text"
                        class="form-input color-hex-text"
                        placeholder="#6E0516"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Secondary / Gold</label>
                    <div class="color-picker-input-group">
                      <input
                        v-model="siteSettingsData.theme.secondaryColor"
                        type="color"
                        class="color-swatch-input"
                      />
                      <input
                        v-model="siteSettingsData.theme.secondaryColor"
                        type="text"
                        class="form-input color-hex-text"
                        placeholder="#E0A526"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Accent / Highlight</label>
                    <div class="color-picker-input-group">
                      <input
                        v-model="siteSettingsData.theme.accentColor"
                        type="color"
                        class="color-swatch-input"
                      />
                      <input
                        v-model="siteSettingsData.theme.accentColor"
                        type="text"
                        class="form-input color-hex-text"
                        placeholder="#D97706"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Background Tone</label>
                    <div class="color-picker-input-group">
                      <input
                        v-model="siteSettingsData.theme.backgroundColor"
                        type="color"
                        class="color-swatch-input"
                      />
                      <input
                        v-model="siteSettingsData.theme.backgroundColor"
                        type="text"
                        class="form-input color-hex-text"
                        placeholder="#F7EFE0"
                      />
                    </div>
                  </div>
                </div>

                <!-- Default theme mode -->
                <div class="form-group mb-0">
                  <label class="form-label">Default Theme Mode</label>
                  <select v-model="siteSettingsData.theme.defaultThemeMode" class="form-select" style="max-width: 280px;">
                    <option value="light">Light Mode (Sacred Sindoor &amp; Gold)</option>
                    <option value="dark">Dark Mode (Deep Nocturnal Sanctum)</option>
                    <option value="system">Follow User System Preference</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 4. SOCIAL MEDIA CHANNELS -->
            <div class="cms-card">
              <div class="cms-card-header">
                <h2 class="cms-card-title">4. Social Media Channels &amp; Links</h2>
                <span class="cms-card-sub">Official communication links shown in the footer and contact sections</span>
              </div>
              <div class="cms-card-body">
                <div class="grid-2-cols mb-3">
                  <div class="form-group">
                    <label class="form-label">Facebook Page URL</label>
                    <input
                      v-model="siteSettingsData.social.facebookUrl"
                      type="url"
                      class="form-input"
                      placeholder="https://facebook.com/golpaharkalimandir"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">YouTube Channel URL</label>
                    <input
                      v-model="siteSettingsData.social.youtubeUrl"
                      type="url"
                      class="form-input"
                      placeholder="https://youtube.com/@golpaharkalimandir"
                    />
                  </div>
                </div>

                <div class="grid-3-cols mb-0">
                  <div class="form-group">
                    <label class="form-label">Instagram Handle / URL</label>
                    <input
                      v-model="siteSettingsData.social.instagramUrl"
                      type="text"
                      class="form-input"
                      placeholder="https://instagram.com/golpaharkalimandir"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">WhatsApp Number / Link</label>
                    <input
                      v-model="siteSettingsData.social.whatsappNumber"
                      type="text"
                      class="form-input"
                      placeholder="+880 1819-000000"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">Twitter / X URL</label>
                    <input
                      v-model="siteSettingsData.social.twitterUrl"
                      type="text"
                      class="form-input"
                      placeholder="https://x.com/golpaharmandir"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 5. CONTACT & MANDIR LOCATION -->
            <div class="cms-card">
              <div class="cms-card-header">
                <h2 class="cms-card-title">5. Official Contact &amp; Mandir Location</h2>
                <span class="cms-card-sub">Inquiry email, devotee hotline phone, and temple location</span>
              </div>
              <div class="cms-card-body">
                <div class="grid-2-cols mb-3">
                  <div class="form-group">
                    <label class="form-label">Official Mandir Email</label>
                    <input
                      v-model="siteSettingsData.contact.email"
                      type="email"
                      class="form-input"
                      placeholder="contact@golpaharkalimandir.org"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">Devotee Hotline / Phone</label>
                    <input
                      v-model="siteSettingsData.contact.phone"
                      type="text"
                      class="form-input"
                      placeholder="+880 31 654321"
                    />
                  </div>
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Physical Mandir Address</label>
                  <input
                    v-model="siteSettingsData.contact.address"
                    type="text"
                    class="form-input"
                    placeholder="Golpahar, Mehedibag Road, Chittagong, Bangladesh"
                  />
                </div>

                <div class="form-group mb-0">
                  <label class="form-label">Google Maps Directions Link</label>
                  <input
                    v-model="siteSettingsData.contact.googleMapsUrl"
                    type="url"
                    class="form-input"
                    placeholder="https://maps.google.com/?q=Golpahar+Kali+Mandir"
                  />
                </div>
              </div>
            </div>

            <!-- 6. ANNOUNCEMENT BANNER -->
            <div class="cms-card">
              <div class="cms-card-header">
                <h2 class="cms-card-title">6. Global Announcement Banner</h2>
                <span class="cms-card-sub">Top bar banner for urgent temple alerts, holiday notices, or festival announcements</span>
              </div>
              <div class="cms-card-body">
                <div class="form-group mb-3">
                  <label class="checkbox-label" style="display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                    <input
                      v-model="siteSettingsData.announcement.enabled"
                      type="checkbox"
                      class="form-checkbox"
                    />
                    <span style="font-weight: 600; font-size: 0.9rem; color: var(--adm-text-main);">
                      Enable Global Announcement Banner
                    </span>
                  </label>
                </div>

                <div class="grid-2-cols mb-0">
                  <div class="form-group">
                    <label class="form-label">Banner Notice Text</label>
                    <input
                      v-model="siteSettingsData.announcement.message"
                      type="text"
                      class="form-input"
                      placeholder="e.g. Special Kali Puja darshan timings will begin at 6:00 PM."
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">Banner Action Link (Optional)</label>
                    <input
                      v-model="siteSettingsData.announcement.link"
                      type="text"
                      class="form-input"
                      placeholder="e.g. /festivals-and-events"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Save Action Button Bottom -->
            <div class="module-header-actions mt-4 pb-4">
              <button
                type="submit"
                class="btn-primary"
                :disabled="savingSiteSettings"
              >
                <span>{{ savingSiteSettings ? 'Saving Changes...' : 'Save General Site Settings' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- =============================================================== -->
        <!-- TAB 8: CONTACT MESSAGES & INQUIRIES                             -->
        <!-- =============================================================== -->
        <div v-else-if="activeModule === 'messages'" class="tab-pane">
          <!-- Module Header -->
          <div class="module-header-row">
            <div>
              <h1 class="module-title">Contact Messages &amp; Inquiries</h1>
              <p class="module-subtitle">
                Review and respond to messages, prayer petitions, and seva inquiries submitted from the Mandir Contact page.
              </p>
            </div>
            <div class="module-header-actions">
              <button type="button" class="btn-refresh" @click="fetchMessagesData" title="Refresh messages list">
                Refresh
              </button>
            </div>
          </div>

          <!-- Filters Bar -->
          <div class="filters-bar">
            <div class="search-box">
              <input
                type="text"
                v-model="messageSearchQuery"
                class="search-input"
                placeholder="Search by devotee name, phone, email, subject, or message text..."
              />
              <button v-if="messageSearchQuery" class="clear-search-btn" @click="messageSearchQuery = ''">&times;</button>
            </div>

            <div class="filter-pills">
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': messageStatusFilter === 'all' }"
                @click="messageStatusFilter = 'all'"
              >
                All ({{ totalMessagesCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': messageStatusFilter === 'new' }"
                @click="messageStatusFilter = 'new'"
              >
                New ({{ newMessagesCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': messageStatusFilter === 'read' }"
                @click="messageStatusFilter = 'read'"
              >
                Read ({{ readMessagesCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': messageStatusFilter === 'replied' }"
                @click="messageStatusFilter = 'replied'"
              >
                Replied ({{ repliedMessagesCount }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': messageStatusFilter === 'archived' }"
                @click="messageStatusFilter = 'archived'"
              >
                Archived ({{ archivedMessagesCount }})
              </button>
            </div>
          </div>

          <!-- Messages Table / Card List -->
          <div class="schedule-table-card">
            <div v-if="loadingMessages" class="loading-state">
              <div class="spinner"></div>
              <span>Loading contact messages from Sanctum database...</span>
            </div>

            <div v-else-if="filteredMessages.length === 0" class="empty-state">
              <h3 class="empty-title">No messages found</h3>
              <p class="empty-desc">
                {{ messageSearchQuery ? 'No message records match your search filter.' : 'No devotee contact messages in this category.' }}
              </p>
            </div>

            <div v-else class="booking-items-list">
              <div
                v-for="item in filteredMessages"
                :key="item.id"
                class="booking-row-item"
                :class="`message-status-${item.status}`"
              >
                <!-- Reference Badge & Date Col -->
                <div class="booking-ref-col">
                  <span class="booking-ref-pill">#GKM-{{ item.id.toString().padStart(5, '0') }}</span>
                  <span class="booking-created-date">Submitted: {{ new Date(item.createdAt).toLocaleDateString() }}</span>
                </div>

                <!-- Devotee Contact Info Col -->
                <div class="booking-devotee-col">
                  <div class="devotee-name-row">
                    <span class="devotee-name">{{ item.name }}</span>
                  </div>
                  <div class="devotee-contact-row">
                    <a v-if="item.phone" :href="`tel:${item.phone}`" class="contact-link phone-link">{{ item.phone }}</a>
                    <a v-if="item.email" :href="`mailto:${item.email}`" class="contact-link email-link">{{ item.email }}</a>
                    <span v-if="!item.phone && !item.email" class="text-xs text-muted">No phone / email</span>
                  </div>
                </div>

                <!-- Subject & Message Snippet Col -->
                <div class="booking-puja-col" style="cursor: pointer;" @click="openMessageModal(item)">
                  <div class="puja-booked-badge">
                    <span class="puja-booked-name font-bold">{{ item.subject }}</span>
                  </div>
                  <div class="devotee-note-box">
                    <span class="note-quote">“{{ item.message.slice(0, 150) }}{{ item.message.length > 150 ? '...' : '' }}”</span>
                  </div>
                </div>

                <!-- Status & Admin Notes Col -->
                <div class="booking-status-col">
                  <span class="booking-status-pill" :class="`pill-${item.status}`">
                    {{ item.status.toUpperCase() }}
                  </span>
                  <div v-if="item.adminNote" class="admin-note-preview" :title="item.adminNote">
                    <span>Note: {{ item.adminNote }}</span>
                  </div>
                </div>

                <!-- Workflow Actions Col -->
                <div class="booking-actions-col">
                  <!-- View Full Message Button -->
                  <button
                    type="button"
                    class="btn-booking-confirm"
                    title="Read full message and respond"
                    @click="openMessageModal(item)"
                  >
                    View
                  </button>

                  <!-- Mark as Replied -->
                  <button
                    v-if="item.status !== 'replied'"
                    type="button"
                    class="btn-booking-complete"
                    title="Mark as replied"
                    @click="changeMessageStatus(item, 'replied')"
                  >
                    Replied
                  </button>

                  <!-- Mark as Archived -->
                  <button
                    v-if="item.status !== 'archived'"
                    type="button"
                    class="btn-booking-cancel"
                    title="Archive this message"
                    @click="changeMessageStatus(item, 'archived')"
                  >
                    Archive
                  </button>

                  <!-- Delete (Admin) -->
                  <button
                    v-if="isAdmin"
                    type="button"
                    class="btn-action-del"
                    title="Delete message"
                    @click="confirmDeleteMessage(item)"
                  >
                    <span>Delete</span>
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

    <!-- =================================================================== -->
    <!-- ADD / EDIT DEITY MODAL DIALOG                                       -->
    <!-- =================================================================== -->
    <div v-if="isDeityModalOpen" class="modal-backdrop" @click.self="isDeityModalOpen = false">
      <div class="modal-dialog modal-dialog-lg">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="modal-tag">{{ isEditingDeity ? 'EDIT DEITY' : 'NEW DEITY PROFILE' }}</span>
            <h2 class="modal-title">{{ isEditingDeity ? 'Edit Deity Profile' : 'Add New Deity Profile' }}</h2>
          </div>
          <button type="button" class="modal-close-btn" @click="isDeityModalOpen = false">&times;</button>
        </div>

        <form @submit.prevent="saveDeityItem" class="modal-form">
          <div class="modal-body">
            <!-- 1. SLUG & IMAGE URL ROW -->
            <div class="form-row-2">
              <div class="form-group flex-1">
                <label class="form-label">
                  URL Slug <span class="required-star">*</span>
                </label>
                <div class="input-with-prefix">
                  <span class="input-prefix">/</span>
                  <input
                    type="text"
                    v-model="deityForm.slug"
                    class="form-input font-mono"
                    placeholder="maa-kali"
                    @input="onDeitySlugManualEdit"
                  />
                </div>
                <span v-if="deityFormErrors.slug" class="error-msg">{{ deityFormErrors.slug }}</span>
                <span class="hint-text">Identifier (lowercase letters & hyphens)</span>
              </div>

              <div class="form-group flex-1">
                <label class="form-label">Darshan Image (URL or Media Key)</label>
                <input
                  type="text"
                  v-model="deityForm.imageId"
                  class="form-input"
                  placeholder="e.g. /images/deities/kali.jpg or https://..."
                />
                <div class="deity-presets-bar mt-1">
                  <span class="text-xs text-muted mr-1 font-bold">Presets:</span>
                  <button type="button" class="btn-preset-mini" @click="deityForm.imageId = '/images/deities/kali.jpg'">Maa Kali</button>
                  <button type="button" class="btn-preset-mini" @click="deityForm.imageId = '/images/deities/shiva.jpg'">Lord Shiva</button>
                  <button type="button" class="btn-preset-mini" @click="deityForm.imageId = '/images/deities/ganesha.jpg'">Lord Ganesha</button>
                  <button type="button" class="btn-preset-mini" @click="deityForm.imageId = '/images/deities/krishna.jpg'">Radha Krishna</button>
                  <button type="button" class="btn-preset-mini" @click="deityForm.imageId = '/images/deities/lakshmi.jpg'">Maa Lakshmi</button>
                </div>
                <div v-if="deityForm.imageId" class="deity-preview-box mt-2">
                  <img :src="deityForm.imageId" alt="Preview" class="deity-preview-thumb" onerror="this.style.display='none'" />
                  <button type="button" class="btn-clear-preview" @click="deityForm.imageId = ''">Remove Image</button>
                </div>
                <span class="hint-text">Path to deity portrait or darshan photo</span>
              </div>
            </div>

            <!-- 2. BILINGUAL CONTENT TABS -->
            <div class="lang-tab-bar">
              <button
                type="button"
                class="lang-tab-btn"
                :class="{ 'lang-tab-active': activeDeityLangTab === 'en' }"
                @click="activeDeityLangTab = 'en'"
              >
                <span>English Content</span>
                <span class="lang-req-dot">• Required</span>
              </button>
              <button
                type="button"
                class="lang-tab-btn"
                :class="{ 'lang-tab-active': activeDeityLangTab === 'bn' }"
                @click="activeDeityLangTab = 'bn'"
              >
                <span>বাংলা বিবরণ</span>
                <span class="lang-opt-badge">(ঐচ্ছিক)</span>
              </button>
            </div>

            <!-- English Fields -->
            <div v-show="activeDeityLangTab === 'en'" class="lang-fields-box">
              <div class="form-group">
                <label class="form-label">
                  Deity Name (English) <span class="required-star">*</span>
                </label>
                <input
                  type="text"
                  v-model="deityForm.nameEn"
                  class="form-input"
                  placeholder="e.g. Maa Kali, Lord Shiva, Radha Krishna"
                  @input="onDeityNameEnInput"
                />
                <span v-if="deityFormErrors.nameEn" class="error-msg">{{ deityFormErrors.nameEn }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">Subtitle / Divine Epithet (English)</label>
                <input
                  type="text"
                  v-model="deityForm.subtitleEn"
                  class="form-input"
                  placeholder="e.g. The Presiding Divine Mother of Golpahar"
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  Sacred Significance & History (English) <span class="required-star">*</span>
                </label>
                <textarea
                  v-model="deityForm.descEn"
                  class="form-textarea"
                  rows="4"
                  placeholder="Embodiment of Shakti, wisdom, and eternal protection..."
                ></textarea>
                <span v-if="deityFormErrors.descEn" class="error-msg">{{ deityFormErrors.descEn }}</span>
              </div>
            </div>

            <!-- Bengali Fields -->
            <div v-show="activeDeityLangTab === 'bn'" class="lang-fields-box">
              <div class="form-group">
                <label class="form-label">বিগ্রহের নাম (বাংলা)</label>
                <input
                  type="text"
                  v-model="deityForm.nameBn"
                  class="form-input"
                  placeholder="যেমন: মা কালী, শ্রী মহাদেব শিব, রাধাকৃষ্ণ"
                />
              </div>

              <div class="form-group">
                <label class="form-label">মহিমা ও উপাধি (বাংলা)</label>
                <input
                  type="text"
                  v-model="deityForm.subtitleBn"
                  class="form-input"
                  placeholder="যেমন: গোলপাহাড় মহাশ্মশানের প্রধান অধিষ্ঠাত্রী দেবী"
                />
              </div>

              <div class="form-group">
                <label class="form-label">বিগ্রহের মাহাত্ম্য ও ইতিহাস (বাংলা)</label>
                <textarea
                  v-model="deityForm.descBn"
                  class="form-textarea"
                  rows="4"
                  placeholder="শক্তিরূপা ও করুণাময়ী জগতের পালনকর্ত্রী..."
                ></textarea>
              </div>
            </div>

            <!-- 3. SORT ORDER & ACTIVE STATUS -->
            <div class="form-row-2 align-center">
              <div class="form-group flex-1">
                <label class="form-label">Display Order</label>
                <input
                  type="number"
                  v-model.number="deityForm.sortOrder"
                  class="form-input"
                  min="0"
                />
                <span class="hint-text">Sequence on the temple deities darshan carousel</span>
              </div>

              <div class="form-group flex-1 checkbox-group">
                <label class="form-label">Visibility Status</label>
                <label class="checkbox-container">
                  <input type="checkbox" v-model="deityForm.active" />
                  <span class="checkbox-label-text">
                    {{ deityForm.active ? 'Active (Visible on public portal)' : 'Hidden (Draft only)' }}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="isDeityModalOpen = false">Cancel</button>
            <button type="submit" class="btn-save" :disabled="savingDeity">
              <span>{{ savingDeity ? 'Saving...' : isEditingDeity ? 'Update Deity' : 'Save Deity' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- DELETE DEITY CONFIRMATION MODAL                                     -->
    <!-- =================================================================== -->
    <div v-if="deleteConfirmDeity" class="modal-backdrop" @click.self="deleteConfirmDeity = null">
      <div class="modal-dialog modal-dialog-sm">
        <div class="modal-header">
          <h2 class="modal-title text-red-500">Confirm Deity Deletion</h2>
          <button type="button" class="modal-close-btn" @click="deleteConfirmDeity = null">&times;</button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">
            Are you sure you want to delete <strong>{{ deleteConfirmDeity.name.en }}</strong>?
          </p>
          <p class="confirm-warning">
            This will permanently remove this deity profile from the temple portal and record an audit log.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="deleteConfirmDeity = null">Cancel</button>
          <button
            type="button"
            class="btn-delete-confirm"
            :disabled="deletingDeity"
            @click="executeDeleteDeity"
          >
            <span>{{ deletingDeity ? 'Deleting...' : 'Yes, Delete' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- ADD / EDIT NOTICE MODAL DIALOG                                      -->
    <!-- =================================================================== -->
    <div v-if="isNoticeModalOpen" class="modal-backdrop" @click.self="isNoticeModalOpen = false">
      <div class="modal-dialog modal-dialog-lg">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="modal-tag">{{ isEditingNotice ? 'EDIT NOTICE' : 'NEW NOTICE' }}</span>
            <h2 class="modal-title">{{ isEditingNotice ? 'Edit Temple Notice' : 'Publish New Notice' }}</h2>
          </div>
          <button type="button" class="modal-close-btn" @click="isNoticeModalOpen = false">&times;</button>
        </div>

        <form @submit.prevent="saveNoticeItem" class="modal-form">
          <div class="modal-body">
            <!-- 1. SLUG, CATEGORY & DATE ROW -->
            <div class="form-row-3">
              <div class="form-group flex-1">
                <label class="form-label">
                  URL Slug <span class="required-star">*</span>
                </label>
                <div class="input-with-prefix">
                  <span class="input-prefix">/</span>
                  <input
                    type="text"
                    v-model="noticeForm.slug"
                    class="form-input font-mono"
                    placeholder="timing-update"
                    @input="onNoticeSlugManualEdit"
                  />
                </div>
                <span v-if="noticeFormErrors.slug" class="error-msg">{{ noticeFormErrors.slug }}</span>
              </div>

              <div class="form-group flex-1">
                <label class="form-label">Category <span class="required-star">*</span></label>
                <select v-model="noticeForm.category" class="form-input">
                  <option value="general">General Notice</option>
                  <option value="festival">Festival / Special Puja</option>
                  <option value="timings">Mandir Timings</option>
                  <option value="announcement">Important Announcement</option>
                </select>
              </div>

              <div class="form-group flex-1">
                <label class="form-label">Notice Date <span class="required-star">*</span></label>
                <input
                  type="date"
                  v-model="noticeForm.date"
                  class="form-input"
                />
                <span v-if="noticeFormErrors.date" class="error-msg">{{ noticeFormErrors.date }}</span>
              </div>
            </div>

            <!-- 2. BILINGUAL CONTENT TABS -->
            <div class="lang-tab-bar">
              <button
                type="button"
                class="lang-tab-btn"
                :class="{ 'lang-tab-active': activeNoticeLangTab === 'en' }"
                @click="activeNoticeLangTab = 'en'"
              >
                <span>English Content</span>
                <span class="lang-req-dot">• Required</span>
              </button>
              <button
                type="button"
                class="lang-tab-btn"
                :class="{ 'lang-tab-active': activeNoticeLangTab === 'bn' }"
                @click="activeNoticeLangTab = 'bn'"
              >
                <span>বাংলা নোটিশ</span>
                <span class="lang-opt-badge">(ঐচ্ছিক)</span>
              </button>
            </div>

            <!-- English Fields -->
            <div v-show="activeNoticeLangTab === 'en'" class="lang-fields-box">
              <div class="form-group">
                <label class="form-label">
                  Notice Title (English) <span class="required-star">*</span>
                </label>
                <input
                  type="text"
                  v-model="noticeForm.titleEn"
                  class="form-input"
                  placeholder="e.g. Special Timings for Kali Puja Night"
                  @input="onNoticeTitleEnInput"
                />
                <span v-if="noticeFormErrors.titleEn" class="error-msg">{{ noticeFormErrors.titleEn }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">
                  Notice Body / Text (English) <span class="required-star">*</span>
                </label>
                <textarea
                  v-model="noticeForm.bodyEn"
                  class="form-textarea"
                  rows="4"
                  placeholder="Enter official circular details..."
                ></textarea>
                <span v-if="noticeFormErrors.bodyEn" class="error-msg">{{ noticeFormErrors.bodyEn }}</span>
              </div>
            </div>

            <!-- Bengali Fields -->
            <div v-show="activeNoticeLangTab === 'bn'" class="lang-fields-box">
              <div class="form-group">
                <label class="form-label">নোটিশের শিরোনাম (বাংলা)</label>
                <input
                  type="text"
                  v-model="noticeForm.titleBn"
                  class="form-input"
                  placeholder="যেমন: শ্যামাপূজা উপলক্ষে ভক্তবৃন্দের জন্য বিশেষ বিজ্ঞপ্তি"
                />
              </div>

              <div class="form-group">
                <label class="form-label">নোটিশের মূল বিষয়বস্তু (বাংলা)</label>
                <textarea
                  v-model="noticeForm.bodyBn"
                  class="form-textarea"
                  rows="4"
                  placeholder="বিজ্ঞপ্তির বিস্তারিত বিবরণ..."
                ></textarea>
              </div>
            </div>

            <!-- 3. PINNED & ACTIVE SWITCHES -->
            <div class="form-row-2 align-center">
              <div class="form-group flex-1 checkbox-group">
                <label class="form-label">Pin to Top of Notice Board</label>
                <label class="checkbox-container">
                  <input type="checkbox" v-model="noticeForm.pinned" />
                  <span class="checkbox-label-text">
                    {{ noticeForm.pinned ? 'Pinned Notice (Highlighted at top)' : 'Standard Notice' }}
                  </span>
                </label>
              </div>

              <div class="form-group flex-1 checkbox-group">
                <label class="form-label">Visibility Status</label>
                <label class="checkbox-container">
                  <input type="checkbox" v-model="noticeForm.active" />
                  <span class="checkbox-label-text">
                    {{ noticeForm.active ? 'Active (Live on website)' : 'Hidden (Draft only)' }}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="isNoticeModalOpen = false">Cancel</button>
            <button type="submit" class="btn-save" :disabled="savingNotice">
              <span>{{ savingNotice ? 'Saving...' : isEditingNotice ? 'Update Notice' : 'Publish Notice' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- DELETE NOTICE CONFIRMATION MODAL                                    -->
    <!-- =================================================================== -->
    <div v-if="deleteConfirmNotice" class="modal-backdrop" @click.self="deleteConfirmNotice = null">
      <div class="modal-dialog modal-dialog-sm">
        <div class="modal-header">
          <h2 class="modal-title text-red-500">Confirm Notice Deletion</h2>
          <button type="button" class="modal-close-btn" @click="deleteConfirmNotice = null">&times;</button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">
            Are you sure you want to delete <strong>{{ deleteConfirmNotice.title.en }}</strong>?
          </p>
          <p class="confirm-warning">
            This will permanently remove this notice from the temple notice board.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="deleteConfirmNotice = null">Cancel</button>
          <button
            type="button"
            class="btn-delete-confirm"
            :disabled="deletingNotice"
            @click="executeDeleteNotice"
          >
            <span>{{ deletingNotice ? 'Deleting...' : 'Yes, Delete' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- BOOKING ADMIN NOTE MODAL                                            -->
    <!-- =================================================================== -->
    <div v-if="isBookingNoteModalOpen && activeBookingNoteItem" class="modal-backdrop" @click.self="isBookingNoteModalOpen = false">
      <div class="modal-dialog modal-dialog-sm">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="modal-tag">INTERNAL RECORD</span>
            <h2 class="modal-title">Temple Note for {{ activeBookingNoteItem.ref }}</h2>
          </div>
          <button type="button" class="modal-close-btn" @click="isBookingNoteModalOpen = false">&times;</button>
        </div>
        <form @submit.prevent="saveBookingAdminNote" class="modal-form">
          <div class="modal-body">
            <div class="booking-summary-box">
              <div><strong>Devotee:</strong> {{ activeBookingNoteItem.name }} ({{ activeBookingNoteItem.phone }})</div>
              <div><strong>Puja:</strong> {{ activeBookingNoteItem.pujaName?.en || 'Custom' }} on {{ activeBookingNoteItem.preferredDate }}</div>
            </div>

            <div class="form-group">
              <label class="form-label">Internal Priest / Office Note</label>
              <textarea
                v-model="bookingAdminNoteInput"
                class="form-textarea"
                rows="4"
                placeholder="e.g. Confirmed with devotee by phone. Sankalpa arranged for 7:30 PM..."
              ></textarea>
              <span class="hint-text">Only visible to administrators and temple staff</span>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="isBookingNoteModalOpen = false">Cancel</button>
            <button type="submit" class="btn-save" :disabled="updatingBookingStatus">
              <span>{{ updatingBookingStatus ? 'Saving...' : 'Save Note' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- DELETE BOOKING CONFIRMATION MODAL                                   -->
    <!-- =================================================================== -->
    <div v-if="deleteConfirmBooking" class="modal-backdrop" @click.self="deleteConfirmBooking = null">
      <div class="modal-dialog modal-dialog-sm">
        <div class="modal-header">
          <h2 class="modal-title text-red-500">Confirm Booking Deletion</h2>
          <button type="button" class="modal-close-btn" @click="deleteConfirmBooking = null">&times;</button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">
            Are you sure you want to delete booking request <strong>{{ deleteConfirmBooking.ref }}</strong> ({{ deleteConfirmBooking.name }})?
          </p>
          <p class="confirm-warning">
            This action cannot be undone. An audit record will be logged.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="deleteConfirmBooking = null">Cancel</button>
          <button
            type="button"
            class="btn-delete-confirm"
            :disabled="deletingBooking"
            @click="executeDeleteBooking"
          >
            <span>{{ deletingBooking ? 'Deleting...' : 'Yes, Delete Record' }}</span>
          </button>
        </div>
      </div>
    </div>

    
    <!-- =================================================================== -->
    <!-- VIEW / RESPOND TO CONTACT MESSAGE MODAL                             -->
    <!-- =================================================================== -->
    <div v-if="isMessageModalOpen && activeMessageItem" class="modal-backdrop" @click.self="isMessageModalOpen = false">
      <div class="modal-dialog modal-dialog-lg">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="modal-tag">INQUIRY #GKM-{{ activeMessageItem.id.toString().padStart(5, '0') }}</span>
            <h2 class="modal-title">{{ activeMessageItem.subject }}</h2>
          </div>
          <button type="button" class="modal-close-btn" @click="isMessageModalOpen = false">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Devotee Profile Header Box -->
          <div class="booking-summary-box mb-4">
            <div><strong>Devotee:</strong> {{ activeMessageItem.name }}</div>
            <div>
              <strong>Contact:</strong>
              <span v-if="activeMessageItem.phone" class="ml-1 mr-2">
                <a :href="`tel:${activeMessageItem.phone}`" class="contact-link phone-link">{{ activeMessageItem.phone }}</a>
                <a :href="`https://wa.me/${activeMessageItem.phone.replace(/[^0-9]/g, '')}`" target="_blank" rel="noopener noreferrer" class="contact-link ml-1">WhatsApp</a>
              </span>
              <span v-if="activeMessageItem.email">
                <a :href="`mailto:${activeMessageItem.email}?subject=Regarding: ${encodeURIComponent(activeMessageItem.subject)}`" class="contact-link email-link">{{ activeMessageItem.email }}</a>
              </span>
              <span v-if="!activeMessageItem.phone && !activeMessageItem.email" class="text-muted ml-1">Not provided</span>
            </div>
            <div><strong>Submitted:</strong> {{ new Date(activeMessageItem.createdAt).toLocaleString() }}</div>
            <div>
              <strong>Current Status:</strong>
              <span class="booking-status-pill ml-2" :class="`pill-${activeMessageItem.status}`">{{ activeMessageItem.status.toUpperCase() }}</span>
            </div>
          </div>

          <!-- Full Message Body -->
          <div class="form-group mb-4">
            <label class="form-label">Message Content</label>
            <div class="p-3 bg-gray-50 border rounded text-sm text-gray-800 whitespace-pre-wrap leading-relaxed" style="background: var(--adm-surface); border: 1px solid var(--adm-border); border-radius: 6px; padding: 1rem;">
              {{ activeMessageItem.message }}
            </div>
          </div>

          <!-- Internal Admin Note -->
          <div class="form-group">
            <label class="form-label">Staff / Admin Follow-up Note</label>
            <textarea
              v-model="messageAdminNoteInput"
              class="form-textarea"
              rows="3"
              placeholder="e.g. Replied via email with darshan timing details. Or spoke with devotee over phone..."
            ></textarea>
            <span class="hint-text">Saved notes are only visible to Mandir admin and staff members</span>
          </div>

          <!-- Status Switcher -->
          <div class="form-group mt-3">
            <label class="form-label">Change Status</label>
            <div class="filter-pills">
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': activeMessageItem.status === 'new' }"
                @click="changeMessageStatus(activeMessageItem, 'new')"
              >
                New
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': activeMessageItem.status === 'read' }"
                @click="changeMessageStatus(activeMessageItem, 'read')"
              >
                Read
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': activeMessageItem.status === 'replied' }"
                @click="changeMessageStatus(activeMessageItem, 'replied')"
              >
                Replied
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ 'filter-pill-active': activeMessageItem.status === 'archived' }"
                @click="changeMessageStatus(activeMessageItem, 'archived')"
              >
                Archived
              </button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="isMessageModalOpen = false">Close</button>
          <button type="button" class="btn-save" :disabled="updatingMessageStatus" @click="saveMessageAdminNote">
            <span>{{ updatingMessageStatus ? 'Saving...' : 'Save Note' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- DELETE MESSAGE CONFIRMATION MODAL                                   -->
    <!-- =================================================================== -->
    <div v-if="deleteConfirmMessage" class="modal-backdrop" @click.self="deleteConfirmMessage = null">
      <div class="modal-dialog modal-dialog-sm">
        <div class="modal-header">
          <h2 class="modal-title text-red-500">Confirm Message Deletion</h2>
          <button type="button" class="modal-close-btn" @click="deleteConfirmMessage = null">&times;</button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">
            Are you sure you want to delete inquiry <strong>#GKM-{{ deleteConfirmMessage.id.toString().padStart(5, '0') }}</strong> from {{ deleteConfirmMessage.name }}?
          </p>
          <p class="confirm-warning">
            This action cannot be undone.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="deleteConfirmMessage = null">Cancel</button>
          <button
            type="button"
            class="btn-delete-confirm"
            :disabled="deletingMessage"
            @click="executeDeleteMessage"
          >
            <span>{{ deletingMessage ? 'Deleting...' : 'Yes, Delete Record' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- ADD / EDIT EVENT OR FESTIVAL MODAL                                  -->
    <!-- =================================================================== -->
    <div v-if="isEventModalOpen" class="modal-backdrop" @click.self="isEventModalOpen = false">
      <div class="modal-dialog modal-dialog-lg">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="modal-tag">{{ isEditingEvent ? 'EDIT FESTIVAL / EVENT' : 'NEW FESTIVAL / EVENT' }}</span>
            <h2 class="modal-title">{{ isEditingEvent ? 'Edit Festival or Event' : 'Add New Festival or Event' }}</h2>
          </div>
          <button type="button" class="modal-close-btn" @click="isEventModalOpen = false">&times;</button>
        </div>

        <form @submit.prevent="saveEvent" class="modal-form">
          <div class="modal-body">
            <!-- Language Selector Tabs -->
            <div class="lang-tabs-bar">
              <button
                type="button"
                class="lang-tab-btn"
                :class="{ 'lang-tab-active': eventActiveTab === 'en' }"
                @click="eventActiveTab = 'en'"
              >
                <span>English Details</span>
                <span v-if="!eventForm.title.en" class="req-dot">*</span>
              </button>
              <button
                type="button"
                class="lang-tab-btn"
                :class="{ 'lang-tab-active': eventActiveTab === 'bn' }"
                @click="eventActiveTab = 'bn'"
              >
                <span>বাংলা বিবরণ (Bengali)</span>
              </button>
            </div>

            <!-- TAB 1: ENGLISH DETAILS -->
            <div v-show="eventActiveTab === 'en'" class="lang-tab-content">
              <div class="form-group">
                <label class="form-label">
                  Festival / Event Title (English) <span class="required-star">*</span>
                </label>
                <input
                  type="text"
                  v-model="eventForm.title.en"
                  class="form-input"
                  placeholder="e.g. Maha Kali Puja & Deepavali Festival"
                  @blur="autoGenerateEventSlug"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  Lunar Tithi / Bengali Date (English) <span class="optional-badge">Optional</span>
                </label>
                <input
                  type="text"
                  v-model="eventForm.label.en"
                  class="form-input"
                  placeholder="e.g. Kartika Amavasya, Maha Ashtami, or Purnima"
                />
                <span class="form-hint">Auspicious lunar phase or traditional calendar reference.</span>
              </div>

              <div class="form-group">
                <label class="form-label">
                  Event Overview & Schedule (English) <span class="required-star">*</span>
                </label>
                <textarea
                  v-model="eventForm.description.en"
                  class="form-textarea"
                  rows="4"
                  placeholder="Detailed schedule of rituals, pushpanjali, aarti, and prasad distribution..."
                  required
                ></textarea>
              </div>
            </div>

            <!-- TAB 2: BENGALI DETAILS -->
            <div v-show="eventActiveTab === 'bn'" class="lang-tab-content">
              <div class="form-group">
                <label class="form-label">
                  উৎসব / অনুষ্ঠানের শিরোনাম (বাংলা)
                </label>
                <input
                  type="text"
                  v-model="eventForm.title.bn"
                  class="form-input font-bengali"
                  placeholder="যেমন: শ্রীশ্রী শ্যামা পূজা ও দীপাবলি মহোৎসব"
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  তিথি / পঞ্জিকা অনুসারে তারিখ (বাংলা) <span class="optional-badge">ঐচ্ছিক</span>
                </label>
                <input
                  type="text"
                  v-model="eventForm.label.bn"
                  class="form-input font-bengali"
                  placeholder="যেমন: কার্তিক অমাবস্যা তিথি বা শুভ দীপাবলি"
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  উৎসবের বিস্তারিত বিবরণ ও নির্ঘণ্ট (বাংলা)
                </label>
                <textarea
                  v-model="eventForm.description.bn"
                  class="form-textarea font-bengali"
                  rows="4"
                  placeholder="পূজার সময়সূচী, পুষ্পাঞ্জলি, হোমযজ্ঞ ও মহাপ্রসাদ বিতরণের বিবরণ..."
                ></textarea>
              </div>
            </div>

            <!-- COMMON SETTINGS (Both Languages) -->
            <div class="common-section-divider">
              <span>Festival Configuration & Scheduling</span>
            </div>

            <!-- Row: Kind, Date & Time -->
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">
                  Event Category <span class="required-star">*</span>
                </label>
                <select v-model="eventForm.kind" class="form-input">
                  <option value="festival">Festival (উৎসব)</option>
                  <option value="special_puja">Special Puja (বিশেষ পূজা)</option>
                  <option value="seva">Seva / Offering (সেবা)</option>
                  <option value="other">Other (অন্যান্য)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">
                  Event Date <span class="required-star">*</span>
                </label>
                <input
                  type="date"
                  v-model="eventForm.date"
                  class="form-input"
                  required
                />
                <span class="form-hint">Gregorian date in Asia/Dhaka time.</span>
              </div>

              <div class="form-group">
                <label class="form-label">
                  Timing <span class="optional-badge">Optional</span>
                </label>
                <input
                  type="text"
                  v-model="eventForm.time"
                  class="form-input font-mono"
                  placeholder="e.g. 19:30 or 7:00 PM"
                />
                <span class="form-hint">Time or time range for the rituals.</span>
              </div>
            </div>

            <!-- Row: Slug & Active Toggle -->
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">
                  URL Slug <span class="required-star">*</span>
                </label>
                <div class="slug-input-wrap">
                  <input
                    type="text"
                    v-model="eventForm.slug"
                    class="form-input font-mono"
                    placeholder="e.g. maha-kali-puja-2026"
                    required
                  />
                  <button
                    type="button"
                    class="btn-slug-gen"
                    title="Generate slug from English title and date"
                    @click="autoGenerateEventSlug"
                  >
                    Auto
                  </button>
                </div>
                <span class="form-hint">Lowercase alphanumeric characters and hyphens only.</span>
              </div>

              <div class="form-group">
                <label class="form-label">Calendar Visibility</label>
                <div class="checkbox-row-card">
                  <label class="switch-toggle">
                    <input type="checkbox" v-model="eventForm.active" />
                    <span class="switch-slider round"></span>
                  </label>
                  <span class="checkbox-label">
                    {{ eventForm.active ? 'Published on Public Site' : 'Hidden from Devotees' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="isEventModalOpen = false">Cancel</button>
            <button type="submit" class="btn-save-primary" :disabled="savingEvent">
              <span>{{ savingEvent ? 'Saving Event...' : (isEditingEvent ? 'Save Changes' : 'Publish Event') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- DELETE EVENT CONFIRMATION MODAL                                     -->
    <!-- =================================================================== -->
    <div v-if="deleteConfirmEvent" class="modal-backdrop" @click.self="deleteConfirmEvent = null">
      <div class="modal-dialog modal-dialog-sm">
        <div class="modal-header">
          <h2 class="modal-title text-red-500">Confirm Event Deletion</h2>
          <button type="button" class="modal-close-btn" @click="deleteConfirmEvent = null">&times;</button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">
            Are you sure you want to permanently delete event <strong>{{ deleteConfirmEvent.title.en }}</strong> ({{ deleteConfirmEvent.date }})?
          </p>
          <p class="confirm-warning">
            This will immediately remove the event from the public calendar and purge edge caches. An audit log record will be maintained.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="deleteConfirmEvent = null">Cancel</button>
          <button
            type="button"
            class="btn-delete-confirm"
            :disabled="deletingEvent"
            @click="executeDeleteEvent"
          >
            <span>{{ deletingEvent ? 'Deleting...' : 'Yes, Delete Event' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ====================================================
   CLEAN MINIMALIST ADMIN DASHBOARD DESIGN SYSTEM
   Modern, subtle borders, white/light-gray palette,
   black primary buttons, 6px-8px border radii.
   ==================================================== */
.admin-layout {
  --adm-bg: #f8fafc;
  --adm-surface: #ffffff;
  --adm-border: #e2e8f0;
  --adm-border-subtle: #f1f5f9;
  --adm-text-main: #0f172a;
  --adm-text-muted: #64748b;
  --adm-text-light: #94a3b8;
  --adm-black: #0f172a;
  --adm-black-hover: #1e293b;
  --adm-radius-sm: 6px;
  --adm-radius: 8px;
  --adm-radius-lg: 10px;

  display: flex;
  min-height: 100vh;
  background-color: var(--adm-bg);
  color: var(--adm-text-main);
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ====================================================
   TOAST NOTIFICATIONS
   ==================================================== */
.admin-toast {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 1.15rem;
  border-radius: var(--adm-radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
}

.toast-success { background: #059669; color: #ffffff; }
.toast-error { background: #dc2626; color: #ffffff; }
.toast-info { background: #0f172a; color: #ffffff; }

.toast-icon { font-size: 1rem; }
.toast-msg { font-size: 0.85rem; }

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ====================================================
   FIXED SIDEBAR
   ==================================================== */
.admin-sidebar {
  width: 260px;
  background-color: var(--adm-surface);
  border-right: 1px solid var(--adm-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 100;
  transition: transform 0.2s ease;
}

@media (max-width: 1024px) {
  .admin-sidebar {
    transform: translateX(-100%);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
  .admin-sidebar.sidebar-open {
    transform: translateX(0);
  }
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  z-index: 90;
}

.sidebar-header {
  height: 64px;
  padding: 0 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--adm-border-subtle);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
}

.logo-mark {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--adm-text-main);
  line-height: 1.1;
}

.brand-tag {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--adm-text-muted);
  letter-spacing: 0.06em;
}

.mobile-close-btn {
  display: none;
  background: transparent;
  border: none;
  font-size: 1.35rem;
  color: var(--adm-text-muted);
  cursor: pointer;
  line-height: 1;
  padding: 0.25rem;
}

@media (max-width: 1024px) {
  .mobile-close-btn { display: block; }
}

.sidebar-nav {
  flex: 1;
  padding: 1.25rem 0.85rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.nav-group {
  display: flex;
  flex-direction: column;
}

.nav-group-title {
  font-size: 0.675rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--adm-text-light);
  padding: 0.25rem 0.65rem 0.45rem;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.nav-item-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.75rem;
  border-radius: var(--adm-radius-sm);
  background: transparent;
  border: none;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  text-align: left;
}

.nav-item-btn:hover {
  background: var(--adm-border-subtle);
  color: var(--adm-text-main);
}

.nav-item-btn.item-active {
  background: var(--adm-black);
  color: #ffffff;
  font-weight: 600;
}

.item-icon {
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
}

.item-label {
  flex: 1;
}

.item-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  background: var(--adm-border-subtle);
  color: var(--adm-text-muted);
}

.item-active .item-badge {
  background: #334155;
  color: #f8fafc;
}

.item-badge.badge-alert {
  background: #ef4444;
  color: #ffffff;
}

/* Sidebar User Footer */
.sidebar-user-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--adm-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  background: var(--adm-surface);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.user-avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--adm-border-subtle);
  border: 1px solid var(--adm-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.775rem;
  font-weight: 700;
  color: var(--adm-text-main);
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--adm-text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role-badge {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  width: fit-content;
  margin-top: 0.15rem;
}

.role-admin {
  background: var(--adm-border-subtle);
  color: var(--adm-text-main);
  border: 1px solid var(--adm-border);
}

.role-editor {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.btn-logout {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.5rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  color: var(--adm-text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-logout:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.logout-icon {
  width: 14px;
  height: 14px;
}

/* ====================================================
   MAIN WRAPPER & TOP NAVIGATION BAR
   ==================================================== */
.admin-main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 260px;
  min-width: 0;
}

@media (max-width: 1024px) {
  .admin-main-wrapper {
    margin-left: 0;
  }
}

.admin-topbar {
  height: 64px;
  background-color: var(--adm-surface);
  border-bottom: 1px solid var(--adm-border);
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
  gap: 0.85rem;
}

.hamburger-btn {
  display: none;
  background: transparent;
  border: none;
  color: var(--adm-text-main);
  cursor: pointer;
  padding: 0.25rem;
}

.hamburger-btn svg {
  width: 20px;
  height: 20px;
}

@media (max-width: 1024px) {
  .hamburger-btn { display: block; }
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.crumb-root {
  color: var(--adm-text-muted);
}

.crumb-sep {
  color: #cbd5e1;
}

.crumb-active {
  font-weight: 600;
  color: var(--adm-text-main);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.topbar-notifications-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.85rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--adm-text-main);
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
}

.topbar-notifications-btn:hover {
  background: var(--adm-bg);
  border-color: #cbd5e1;
}

.topbar-icon-btn:hover {
  border-color: #cbd5e1;
  color: var(--adm-text-main);
  background: var(--adm-bg);
}

.topbar-svg {
  width: 18px;
  height: 18px;
}

.topbar-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.1rem 0.35rem;
  border-radius: 9999px;
  line-height: 1;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.65rem;
  border-radius: 9999px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  font-size: 0.75rem;
  font-weight: 600;
  color: #047857;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

.btn-live-site {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.85rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--adm-text-main);
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-live-site:hover {
  background: var(--adm-bg);
  border-color: #cbd5e1;
}

.link-arrow {
  width: 13px;
  height: 13px;
  color: var(--adm-text-muted);
}

/* ====================================================
   DASHBOARD BODY
   ==================================================== */
.dashboard-body {
  padding: 2rem 2.25rem 4rem;
  max-width: 1360px;
  width: 100%;
}

.welcome-banner {
  margin-bottom: 2rem;
}

.welcome-badge {
  font-size: 0.675rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--adm-text-muted);
  text-transform: uppercase;
}

.welcome-heading {
  font-size: clamp(1.5rem, 2.5vw, 1.85rem);
  font-weight: 800;
  color: var(--adm-text-main);
  letter-spacing: -0.025em;
  margin: 0.25rem 0 0.35rem;
}

.welcome-sub {
  font-size: 0.875rem;
  color: var(--adm-text-muted);
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background-color: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius);
  padding: 1.25rem 1.35rem;
  display: flex;
  align-items: flex-start;
  gap: 0.95rem;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

.kpi-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.kpi-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: var(--adm-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
  background: var(--adm-bg);
  border: 1px solid var(--adm-border);
}

.gold-icon, .blue-icon, .green-icon, .amber-icon, .purple-icon {
  background: var(--adm-bg);
  border: 1px solid var(--adm-border);
}

.kpi-content {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.775rem;
  color: var(--adm-text-muted);
  font-weight: 600;
  margin-bottom: 0.2rem;
}

.kpi-val {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--adm-text-main);
  line-height: 1.1;
  margin-bottom: 0.25rem;
  letter-spacing: -0.02em;
}

.kpi-trend {
  font-size: 0.75rem;
  color: var(--adm-text-muted);
}

.trend-up {
  color: #059669;
  font-weight: 600;
}

.trend-amber {
  color: #b45309;
  font-weight: 600;
}

.trend-purple {
  color: #7e22ce;
  font-weight: 600;
}

/* Quick Actions Panel */
.dash-panel {
  background-color: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius);
  padding: 1.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.15rem;
}

.panel-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--adm-text-main);
  margin: 0;
}

.panel-tag {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--adm-text-muted);
  background: var(--adm-border-subtle);
  border: 1px solid var(--adm-border);
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.85rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.9rem 1.15rem;
  background: var(--adm-bg);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius-sm);
  color: var(--adm-text-main);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  min-height: 48px;
  transition: all 0.15s ease;
}

.action-btn:hover {
  border-color: var(--adm-black);
  background: var(--adm-surface);
}

.action-btn-icon {
  font-size: 1.4rem;
}

/* ====================================================
   MODULE HEADERS & CONTROLS
   ==================================================== */
.module-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.module-title {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--adm-text-main);
  margin: 0 0 0.25rem;
}

.module-subtitle {
  font-size: 0.85rem;
  color: var(--adm-text-muted);
  margin: 0;
  max-width: 650px;
  line-height: 1.45;
}

.module-header-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-shrink: 0;
}

.btn-refresh {
  padding: 0.55rem 0.95rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  color: #475569;
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-refresh:hover {
  background: var(--adm-bg);
  color: var(--adm-text-main);
  border-color: #cbd5e1;
}

.btn-add-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.15rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-black);
  color: #ffffff;
  font-size: 0.825rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: background-color 0.15s ease;
}

.btn-add-primary:hover {
  background: var(--adm-black-hover);
}

/* Next Aarti Banner */
.next-aarti-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.25rem;
  border-radius: var(--adm-radius);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
}

.aarti-banner-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.aarti-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.aarti-banner-tag {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--adm-text-muted);
  text-transform: uppercase;
}

.aarti-banner-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0.1rem 0 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--adm-text-main);
}

.aarti-time-chip {
  font-size: 0.775rem;
  font-weight: 700;
  background: var(--adm-black);
  color: #ffffff;
  padding: 0.15rem 0.5rem;
  border-radius: var(--adm-radius-sm);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.aarti-banner-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.aarti-badge-day {
  font-size: 0.725rem;
  font-weight: 600;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
}

.badge-today {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.badge-tomorrow {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.aarti-dhaka-clock {
  font-size: 0.75rem;
  color: var(--adm-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* ====================================================
   FILTERS BAR & SEARCH INPUTS
   ==================================================== */
.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  margin-bottom: 1.15rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  font-size: 0.8rem;
  color: var(--adm-text-light);
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.85rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  color: var(--adm-text-main);
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s ease;
}

.search-input:focus {
  border-color: var(--adm-black);
}

.clear-search-btn {
  position: absolute;
  right: 0.65rem;
  background: transparent;
  border: none;
  color: var(--adm-text-muted);
  font-size: 1.1rem;
  cursor: pointer;
}

.filter-pills {
  display: flex;
  gap: 0.35rem;
}

.filter-pill {
  padding: 0.4rem 0.8rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  color: var(--adm-text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill:hover {
  background: var(--adm-bg);
  color: var(--adm-text-main);
}

.filter-pill-active {
  background: var(--adm-black);
  border-color: var(--adm-black);
  color: #ffffff;
}

/* Notice Category Filter Pills */
.category-pills-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1.15rem;
  flex-wrap: wrap;
}

.category-label {
  font-size: 0.775rem;
  font-weight: 600;
  color: var(--adm-text-muted);
  margin-right: 0.25rem;
}

.cat-chip {
  padding: 0.3rem 0.7rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  color: var(--adm-text-muted);
  font-size: 0.775rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cat-chip:hover {
  background: var(--adm-bg);
  color: var(--adm-text-main);
}

.cat-chip-active {
  background: var(--adm-black);
  border-color: var(--adm-black);
  color: #ffffff;
}

/* ====================================================
   MODERN TABLES & LIST CARDS
   ==================================================== */
.schedule-table-card {
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius);
  overflow: hidden;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

.ritual-items-list,
.puja-items-list,
.deity-items-list,
.notice-items-list,
.booking-items-list,
.event-items-list {
  display: flex;
  flex-direction: column;
}

.schedule-row-item,
.puja-row-item,
.deity-row-item,
.notice-row-item,
.booking-row-item,
.event-row-item {
  display: flex;
  align-items: center;
  gap: 1.15rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--adm-border-subtle);
  transition: background-color 0.12s ease;
}

.schedule-row-item:last-child,
.puja-row-item:last-child,
.deity-row-item:last-child,
.notice-row-item:last-child,
.booking-row-item:last-child,
.event-row-item:last-child {
  border-bottom: none;
}

.schedule-row-item:hover,
.puja-row-item:hover,
.deity-row-item:hover,
.notice-row-item:hover,
.booking-row-item:hover,
.event-row-item:hover {
  background-color: var(--adm-bg);
}

.item-inactive {
  opacity: 0.55;
  background: #fafafa;
}

/* Reorder Column */
.reorder-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.btn-reorder {
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: 4px;
  color: var(--adm-text-muted);
  font-size: 0.65rem;
  width: 22px;
  height: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
}

.btn-reorder:hover:not(:disabled) {
  border-color: var(--adm-black);
  color: var(--adm-text-main);
}

.btn-reorder:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.sort-order-num {
  font-size: 0.725rem;
  font-weight: 700;
  color: var(--adm-text-light);
}

/* Time & Details Column */
.time-col {
  flex-shrink: 0;
}

.ritual-time-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-border-subtle);
  border: 1px solid var(--adm-border);
}

.clock-icon { font-size: 0.8rem; }
.time-text {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--adm-text-main);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.details-col {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.2rem;
  flex-wrap: wrap;
}

.ritual-title-en,
.puja-title-en,
.deity-title-en,
.notice-title-en,
.event-title-en {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
  color: var(--adm-text-main);
}

.ritual-title-bn,
.puja-title-bn,
.deity-title-bn,
.notice-title-bn,
.event-title-bn {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  background: var(--adm-border-subtle);
  padding: 0.12rem 0.45rem;
  border-radius: 4px;
  border: 1px solid var(--adm-border);
}

.ritual-desc-en,
.puja-desc-en,
.deity-desc-en,
.notice-body-en,
.event-desc-en {
  font-size: 0.825rem;
  color: var(--adm-text-muted);
  margin: 0 0 0.15rem;
  line-height: 1.4;
}

.ritual-desc-bn,
.puja-desc-bn,
.deity-desc-bn,
.notice-body-bn,
.event-desc-bn {
  font-size: 0.775rem;
  color: var(--adm-text-light);
  margin: 0;
}

/* ====================================================
   STATUS BADGES & SWITCH TOGGLES
   ==================================================== */
.toggle-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.status-caption {
  font-size: 0.675rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.caption-active { color: #059669; }
.caption-hidden { color: var(--adm-text-light); }
.caption-bookable { color: #2563eb; }

/* Switch Toggle (iOS / Modern Minimalist) */
.switch-toggle {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.switch-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #cbd5e1;
  transition: 0.2s ease;
  border-radius: 20px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: #ffffff;
  transition: 0.2s ease;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

input:checked + .switch-slider {
  background-color: var(--adm-black);
}

input:checked + .switch-slider:before {
  transform: translateX(16px);
}

.switch-slider-blue {
  background-color: #cbd5e1;
}

input:checked + .switch-slider-blue {
  background-color: #2563eb;
}

/* Row Action Buttons */
.actions-col {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.btn-action-edit {
  padding: 0.35rem 0.75rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  color: var(--adm-text-main);
  font-size: 0.775rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-action-edit:hover {
  background: var(--adm-bg);
  border-color: #cbd5e1;
}

.btn-action-del {
  padding: 0.35rem 0.65rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  color: #dc2626;
  font-size: 0.775rem;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-action-del:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

/* ====================================================
   PUJAS SPECIFIC STYLING
   ==================================================== */
.puja-meta-badge-col {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex-shrink: 0;
  min-width: 100px;
}

.puja-price-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 0.2rem;
  padding: 0.3rem 0.55rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-border-subtle);
  border: 1px solid var(--adm-border);
}

.currency-sym {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--adm-text-muted);
}

.price-val {
  font-size: 1rem;
  font-weight: 800;
  color: var(--adm-text-main);
  letter-spacing: -0.01em;
}

.puja-duration-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.725rem;
  font-weight: 600;
  color: var(--adm-text-muted);
  background: var(--adm-surface);
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  border: 1px solid var(--adm-border);
  width: fit-content;
}

.puja-slug-pill,
.deity-slug-pill,
.notice-slug-pill,
.event-slug-pill {
  font-size: 0.725rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--adm-text-muted);
  background: var(--adm-border-subtle);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  border: 1px solid var(--adm-border);
}

.puja-details-col {
  flex: 1;
  min-width: 0;
}

.puja-offered-box {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  background: var(--adm-border-subtle);
  border: 1px solid var(--adm-border);
  padding: 0.4rem 0.65rem;
  border-radius: var(--adm-radius-sm);
  margin-top: 0.35rem;
}

.offered-icon {
  font-size: 0.8rem;
  margin-top: 0.05rem;
}

.offered-content {
  font-size: 0.775rem;
  line-height: 1.4;
  color: var(--adm-text-muted);
}

.offered-label {
  font-weight: 700;
  color: var(--adm-text-main);
  margin-right: 0.3rem;
}

.offered-text-bn {
  color: var(--adm-text-light);
  margin-left: 0.2rem;
}

.puja-toggles-col {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  flex-shrink: 0;
  min-width: 120px;
}

.mini-toggle-group {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.mini-toggle-title {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--adm-text-light);
  letter-spacing: 0.04em;
}

.mini-toggle-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

/* ====================================================
   DEITIES & SACRED SHRINES STYLING
   ==================================================== */
.deity-avatar-col {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: var(--adm-radius-sm);
  overflow: hidden;
  border: 1px solid var(--adm-border);
  background: var(--adm-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.deity-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.deity-avatar-placeholder {
  font-size: 1.35rem;
}

.deity-details-col {
  flex: 1;
  min-width: 0;
}

.deity-sub-row {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--adm-text-muted);
  margin-bottom: 0.2rem;
}

.deity-subtitle-bn {
  color: var(--adm-text-light);
  margin-left: 0.25rem;
}

.deity-presets-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.35rem;
}

.btn-preset-mini {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 4px;
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  color: var(--adm-text-main);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-preset-mini:hover {
  background: var(--adm-black);
  color: #ffffff;
}

.deity-preview-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--adm-bg);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius-sm);
  margin-top: 0.5rem;
}

.deity-preview-thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--adm-border);
}

.btn-clear-preview {
  font-size: 0.75rem;
  font-weight: 700;
  color: #dc2626;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}

.btn-clear-preview:hover {
  text-decoration: underline;
}

/* ====================================================
   TEMPLE NOTICES STYLING
   ==================================================== */
.item-pinned {
  border-left: 3px solid var(--adm-black);
  background: #fafafa;
}

.notice-meta-col {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex-shrink: 0;
  min-width: 105px;
}

.notice-date-badge {
  font-size: 0.775rem;
  font-weight: 600;
  color: var(--adm-text-main);
}

.notice-cat-tag {
  font-size: 0.675rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--adm-text-muted);
  background: var(--adm-border-subtle);
  padding: 0.12rem 0.4rem;
  border-radius: 4px;
  width: fit-content;
}

.pinned-indicator-chip {
  font-size: 0.65rem;
  font-weight: 700;
  color: #b45309;
  background: #fef3c7;
  padding: 0.12rem 0.45rem;
  border-radius: 4px;
  border: 1px solid #fde68a;
  width: fit-content;
}

.notice-details-col {
  flex: 1;
  min-width: 0;
}

.notice-controls-col {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  flex-shrink: 0;
  align-items: center;
}

.btn-pin-toggle {
  padding: 0.3rem 0.65rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  color: var(--adm-text-muted);
  font-size: 0.725rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-pin-toggle:hover {
  background: var(--adm-bg);
  color: var(--adm-text-main);
}

.pin-active {
  background: var(--adm-black);
  border-color: var(--adm-black);
  color: #ffffff;
}


/* CMS Form Stack */
.cms-form-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cms-card {
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: 8px;
  overflow: hidden;
}

.cms-card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--adm-border-subtle);
  background: var(--adm-surface-alt, #fafafa);
}

.cms-card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--adm-text-main);
  margin: 0 0 0.2rem;
}

.cms-card-sub {
  font-size: 0.8rem;
  color: var(--adm-text-light);
}

.cms-card-body {
  padding: 1.5rem;
}

.grid-2-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.grid-3-cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.grid-4-cols {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .grid-2-cols,
  .grid-3-cols,
  .grid-4-cols {
    grid-template-columns: 1fr;
  }
}

/* Site Settings Components */
.input-with-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-mini-badge {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--adm-surface-alt, #fafafa);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius-sm, 6px);
  overflow: hidden;
}

.favicon-preview-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.text-muted-mini {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--adm-text-light);
}

.font-preview-box {
  margin-top: 1rem;
  padding: 1.25rem 1.5rem;
  background: var(--adm-surface-alt, #f8fafc);
  border: 1px dashed var(--adm-border);
  border-radius: var(--adm-radius-md, 8px);
}

.preview-tag {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--adm-primary, #6E0516);
  margin-bottom: 0.5rem;
}

.font-preview-heading {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--adm-text-main, #1e293b);
  margin: 0 0 0.5rem;
  line-height: 1.35;
}

.font-preview-body {
  margin: 0;
  line-height: 1.6;
  color: var(--adm-text-secondary, #475569);
}

/* Palette Presets Selection Grid */
.palette-presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
  margin-top: 0.5rem;
}

.palette-preset-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  background: var(--adm-surface);
  border: 1.5px solid var(--adm-border);
  border-radius: var(--adm-radius-md, 8px);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.palette-preset-card:hover {
  border-color: var(--adm-primary, #6E0516);
  transform: translateY(-1px);
}

.palette-preset-card.palette-selected {
  border-color: var(--adm-primary, #6E0516);
  background: rgba(110, 5, 22, 0.04);
  box-shadow: 0 0 0 2px rgba(110, 5, 22, 0.15);
}

.palette-swatches {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.swatch-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.palette-card-name {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--adm-text-main);
}

/* Color Picker Input Group */
.color-picker-input-group {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.color-swatch-input {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  width: 40px;
  height: 38px;
  padding: 0;
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius-sm, 6px);
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}

.color-swatch-input::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-swatch-input::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}

.color-hex-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
}

/* ====================================================
   PUJA BOOKINGS MANAGER STYLING
   ==================================================== */
.booking-status-new {
  border-left: 3px solid #b45309;
}

.booking-status-confirmed {
  border-left: 3px solid #059669;
}

.booking-status-completed {
  border-left: 3px solid #2563eb;
  opacity: 0.85;
}

.booking-status-cancelled {
  border-left: 3px solid #dc2626;
  opacity: 0.6;
}

.booking-ref-col {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
  min-width: 110px;
}

.booking-ref-pill {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--adm-text-main);
  background: var(--adm-border-subtle);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--adm-border);
  width: fit-content;
}

.booking-created-date {
  font-size: 0.7rem;
  color: var(--adm-text-light);
}

.booking-devotee-col {
  flex-shrink: 0;
  min-width: 160px;
}

.devotee-name-row {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  margin-bottom: 0.25rem;
}

.devotee-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--adm-text-main);
}

.devotee-gotra {
  font-size: 0.725rem;
  color: var(--adm-text-muted);
  font-style: italic;
}

.devotee-contact-row {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.contact-link {
  font-size: 0.75rem;
  color: var(--adm-text-muted);
  text-decoration: none;
}

.contact-link:hover {
  color: var(--adm-text-main);
  text-decoration: underline;
}

.booking-puja-col {
  flex: 1;
  min-width: 0;
}

.puja-booked-badge {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.2rem;
}

.puja-booked-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--adm-text-main);
}

.puja-booked-price {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--adm-text-muted);
  background: var(--adm-border-subtle);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.preferred-date-chip {
  font-size: 0.775rem;
  color: var(--adm-text-muted);
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.preferred-date-chip strong {
  color: var(--adm-text-main);
}

.devotee-note-box {
  margin-top: 0.3rem;
  font-size: 0.75rem;
  color: var(--adm-text-muted);
  background: var(--adm-bg);
  padding: 0.3rem 0.55rem;
  border-radius: 4px;
  border-left: 2px solid var(--adm-border);
}

.booking-status-col {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
  min-width: 95px;
}

.booking-status-pill {
  font-size: 0.675rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  width: fit-content;
  text-align: center;
  text-transform: uppercase;
}

.pill-new {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}

.pill-confirmed {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.pill-completed {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.pill-cancelled {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.pill-read {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.pill-replied {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.pill-archived {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.message-status-new {
  border-left: 3px solid #b45309;
}

.message-status-read {
  border-left: 3px solid #2563eb;
}

.message-status-replied {
  border-left: 3px solid #059669;
}

.message-status-archived {
  border-left: 3px solid #6b7280;
  opacity: 0.75;
}


.handled-by-text {
  font-size: 0.65rem;
  color: var(--adm-text-light);
}

.admin-note-preview {
  font-size: 0.675rem;
  color: var(--adm-text-muted);
  background: var(--adm-border-subtle);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.booking-actions-col {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.btn-booking-confirm {
  padding: 0.35rem 0.65rem;
  border-radius: var(--adm-radius-sm);
  background: #059669;
  color: #ffffff;
  font-size: 0.725rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.btn-booking-confirm:hover { background: #047857; }

.btn-booking-complete {
  padding: 0.35rem 0.65rem;
  border-radius: var(--adm-radius-sm);
  background: #2563eb;
  color: #ffffff;
  font-size: 0.725rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.btn-booking-complete:hover { background: #1d4ed8; }

.btn-booking-cancel {
  padding: 0.35rem 0.6rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-surface);
  border: 1px solid #fecaca;
  color: #dc2626;
  font-size: 0.725rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-booking-cancel:hover { background: #fef2f2; }

.btn-booking-note {
  padding: 0.35rem 0.6rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  color: var(--adm-text-muted);
  font-size: 0.725rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-booking-note:hover {
  background: var(--adm-bg);
  color: var(--adm-text-main);
  border-color: #cbd5e1;
}

.booking-summary-box {
  background: var(--adm-border-subtle);
  padding: 0.75rem 0.95rem;
  border-radius: var(--adm-radius-sm);
  border: 1px solid var(--adm-border);
  margin-bottom: 0.95rem;
  font-size: 0.825rem;
  line-height: 1.45;
  color: var(--adm-text-muted);
}

/* ====================================================
   FESTIVALS & EVENTS STYLING
   ==================================================== */
.event-meta-col {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 140px;
}

.event-date-badge {
  font-size: 0.8rem;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--adm-text-main);
  background: var(--adm-border-subtle);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--adm-border);
  display: inline-flex;
  align-items: center;
  width: fit-content;
}

.event-upcoming-tag {
  font-size: 0.65rem;
  font-weight: 700;
  color: #7e22ce;
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  padding: 0.12rem 0.45rem;
  border-radius: 9999px;
  width: fit-content;
}

.event-past-tag {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--adm-text-muted);
  background: var(--adm-border-subtle);
  border: 1px solid var(--adm-border);
  padding: 0.12rem 0.45rem;
  border-radius: 9999px;
  width: fit-content;
}

.event-kind-tag {
  font-size: 0.675rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  width: fit-content;
}

.kind-festival {
  background: #faf5ff;
  color: #7e22ce;
  border: 1px solid #e9d5ff;
}

.kind-special_puja {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.kind-seva {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.kind-other {
  background: var(--adm-border-subtle);
  color: var(--adm-text-muted);
  border: 1px solid var(--adm-border);
}

.event-time-tag {
  font-size: 0.725rem;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--adm-text-muted);
}

.event-details-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.event-tithi-chip {
  font-size: 0.725rem;
  font-weight: 600;
  color: #b45309;
  background: #fef3c7;
  padding: 0.12rem 0.45rem;
  border-radius: 9999px;
  border: 1px solid #fde68a;
}

.event-controls-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-width: 95px;
}

/* ====================================================
   LOADING & EMPTY STATES
   ==================================================== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  padding: 3.5rem 2rem;
  color: var(--adm-text-muted);
  font-size: 0.85rem;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid var(--adm-border);
  border-top-color: var(--adm-black);
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
  padding: 3.5rem 2rem;
  text-align: center;
}

.empty-icon { font-size: 2.2rem; margin-bottom: 0.4rem; opacity: 0.7; }
.empty-title { font-size: 1.1rem; font-weight: 700; margin: 0 0 0.25rem; color: var(--adm-text-main); }
.empty-desc { font-size: 0.825rem; color: var(--adm-text-muted); margin: 0 0 1.15rem; }

/* ====================================================
   MODAL DIALOGS & FORMS
   ==================================================== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(3px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-dialog {
  background-color: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius);
  max-width: 580px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

.modal-dialog-sm {
  max-width: 420px;
}

.modal-dialog-lg {
  max-width: 720px;
  width: 95%;
}

.modal-header {
  padding: 1.15rem 1.35rem;
  border-bottom: 1px solid var(--adm-border-subtle);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.modal-tag {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--adm-text-muted);
  text-transform: uppercase;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0.15rem 0 0;
  color: var(--adm-text-main);
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.35rem;
  color: var(--adm-text-light);
  cursor: pointer;
  line-height: 1;
  padding: 0.2rem;
  transition: color 0.12s;
}

.modal-close-btn:hover { color: var(--adm-text-main); }

.modal-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.modal-body {
  padding: 1.35rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #334155;
}

.required-star { color: #dc2626; }

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  color: var(--adm-text-main);
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--adm-black);
  box-shadow: 0 0 0 1px var(--adm-black);
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.error-msg {
  font-size: 0.725rem;
  color: #dc2626;
  font-weight: 600;
}

.time-presets-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.35rem;
  flex-wrap: wrap;
}

.preset-label {
  font-size: 0.7rem;
  color: var(--adm-text-muted);
  font-weight: 600;
}

.preset-chip {
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: var(--adm-border-subtle);
  border: 1px solid var(--adm-border);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--adm-text-main);
  cursor: pointer;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  transition: all 0.12s;
}

.preset-chip:hover {
  background: var(--adm-border);
}

/* Bilingual Tabs */
.lang-tabs-nav {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.95rem;
  padding-bottom: 0.45rem;
  border-bottom: 1px solid var(--adm-border-subtle);
}

.lang-tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.75rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  font-size: 0.775rem;
  font-weight: 600;
  color: var(--adm-text-muted);
  cursor: pointer;
  transition: all 0.12s ease;
}

.lang-tab-active {
  background: var(--adm-black);
  color: #ffffff;
  border-color: var(--adm-black);
}

.lang-req-dot { color: #dc2626; font-weight: 700; }
.lang-opt-badge { font-size: 0.65rem; opacity: 0.8; }

.lang-fields-box {
  margin-bottom: 0.95rem;
}

.form-row-2 {
  display: flex;
  gap: 0.85rem;
}

.form-row-3 {
  display: flex;
  gap: 0.85rem;
  margin-bottom: 0.85rem;
}

.align-center { align-items: center; }
.flex-1 { flex: 1; }

.hint-text {
  font-size: 0.725rem;
  color: var(--adm-text-muted);
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-top: 0.3rem;
}

.checkbox-container input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--adm-black);
}

.checkbox-label-text {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--adm-text-main);
}

.modal-footer {
  padding: 1rem 1.35rem;
  border-top: 1px solid var(--adm-border-subtle);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  background: var(--adm-surface);
}

.btn-cancel {
  padding: 0.5rem 1rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  color: #334155;
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-cancel:hover {
  background: var(--adm-bg);
}

.btn-save,
.btn-save-primary {
  padding: 0.5rem 1.25rem;
  border-radius: var(--adm-radius-sm);
  background: var(--adm-black);
  color: #ffffff;
  font-size: 0.825rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.btn-save:hover:not(:disabled),
.btn-save-primary:hover:not(:disabled) {
  background: var(--adm-black-hover);
}

.btn-save:disabled,
.btn-save-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.confirm-text {
  font-size: 0.9rem;
  color: var(--adm-text-main);
  margin: 0 0 0.45rem;
  line-height: 1.45;
}

.confirm-warning {
  font-size: 0.8rem;
  color: var(--adm-text-muted);
  margin: 0;
}

.btn-delete-confirm {
  padding: 0.5rem 1.15rem;
  border-radius: var(--adm-radius-sm);
  background: #dc2626;
  color: #ffffff;
  font-size: 0.825rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.btn-delete-confirm:hover { background: #b91c1c; }
.btn-delete-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

.input-with-prefix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 0.75rem;
  color: var(--adm-text-muted);
  font-weight: 700;
  font-size: 0.9rem;
  pointer-events: none;
}

.input-with-prefix .form-input {
  padding-left: 1.85rem;
}

.chip-presets-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.35rem;
}

.chip-presets-row .preset-chip {
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: var(--adm-border-subtle);
  border: 1px solid var(--adm-border);
  color: var(--adm-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;
}

.chip-presets-row .preset-chip:hover {
  border-color: #cbd5e1;
  color: var(--adm-text-main);
}

/* ====================================================
   RESPONSIVE LAYOUT BREAKPOINTS
   ==================================================== */
@media (max-width: 768px) {
  .admin-topbar { padding: 0 1.25rem; }
  .dashboard-body { padding: 1.25rem 1rem 3rem; }
  .schedule-row-item { flex-direction: column; align-items: flex-start; gap: 0.65rem; }
  .actions-col { width: 100%; justify-content: flex-end; }
  .toggle-col { flex-direction: row; gap: 0.45rem; }
  .form-row-2 { flex-direction: column; }
  .puja-row-item { flex-direction: column; align-items: flex-start; gap: 0.65rem; }
  .puja-toggles-col { flex-direction: row; gap: 1.25rem; width: 100%; justify-content: flex-start; }
  .form-row-3 { flex-direction: column; gap: 0.65rem; }
  .event-row-item { flex-direction: column; align-items: flex-start; gap: 0.65rem; }
  .deity-row-item { flex-direction: column; align-items: flex-start; gap: 0.65rem; }
  .notice-row-item { flex-direction: column; align-items: flex-start; gap: 0.65rem; }
  .booking-row-item { flex-direction: column; align-items: flex-start; gap: 0.65rem; }
  .booking-actions-col { width: 100%; justify-content: flex-start; }
}

.admin-auth-loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  background: var(--bg-primary, #F7EFE0);
  color: var(--text-secondary, #6B7280);
}

.admin-auth-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(224, 165, 38, 0.2);
  border-top-color: var(--accent, #6E0516);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.admin-auth-text {
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}
</style>
