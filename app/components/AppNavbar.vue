<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

// Scroll state for transparent -> glass transition
const isScrolled = ref(false);

const handleScroll = () => {
  if (typeof window !== "undefined") {
    isScrolled.value = window.scrollY > 20;
  }
};

// Theme state (light = Palette A: Sindoor & Gold / dark = Palette B: Midnight & Hibiscus)
type Theme = "dark" | "light";
const currentTheme = ref<Theme>("light");

const applyTheme = (theme: Theme) => {
  currentTheme.value = theme;
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("temple_theme", theme);
  }
};

const toggleTheme = (event?: MouseEvent) => {
  const next: Theme = currentTheme.value === "dark" ? "light" : "dark";

  // Check if View Transition API is supported and user doesn't prefer reduced motion
  const isViewTransitionSupported =
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!isViewTransitionSupported) {
    applyTheme(next);
    return;
  }

  // Calculate coordinates of click or center of the toggle button for circular droplet origin
  let x = event?.clientX;
  let y = event?.clientY;

  if (x === undefined || y === undefined || (x === 0 && y === 0)) {
    const target =
      (event?.currentTarget as HTMLElement | null) ||
      (document.querySelector(".theme-toggle") as HTMLElement | null);
    if (target) {
      const rect = target.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else {
      x = window.innerWidth / 2;
      y = 0;
    }
  }

  // Maximum radius to cover the entire viewport from (x, y)
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = (document as any).startViewTransition(async () => {
    applyTheme(next);
    await nextTick();
  });

  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ];

    document.documentElement.animate(
      {
        clipPath: clipPath,
      },
      {
        duration: 550,
        easing: "cubic-bezier(0.25, 1, 0.4, 1)",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  });
};

// Language state (visual toggle for later work)
const currentLang = ref<string>("EN");
const languages = [
  { code: "EN", name: "English", nativeName: "English" },
  { code: "BN", name: "Bengali", nativeName: "বাংলা" },
];
const isLangOpen = ref(false);

const setLanguage = (code: string) => {
  currentLang.value = code;
  isLangOpen.value = false;
};

const toggleLangMenu = () => {
  isLangOpen.value = !isLangOpen.value;
  if (isLangOpen.value) {
    isPujaOpen.value = false;
  }
};

// Puja Dropdown state
const isPujaOpen = ref(false);
const togglePujaMenu = () => {
  isPujaOpen.value = !isPujaOpen.value;
  if (isPujaOpen.value) {
    isLangOpen.value = false;
  }
};

const isPujaActive = computed(() => {
  return route.path === "/puja-and-rituals" || route.path === "/puja-list-and-charges";
});

// Mobile Navigation Drawer
const isMobileMenuOpen = ref(false);
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  if (isMobileMenuOpen.value) {
    isLangOpen.value = false;
    isPujaOpen.value = false;
  }
};

const closeAllDropdowns = () => {
  isLangOpen.value = false;
  isPujaOpen.value = false;
};

// Close mobile drawer and dropdowns on route change
watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false;
    closeAllDropdowns();
  }
);

// Click outside handler
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (!target) return;
  if (!target.closest(".nav-dropdown-trigger") && !target.closest(".nav-dropdown-menu")) {
    closeAllDropdowns();
  }
};

// Keydown Escape handler
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    closeAllDropdowns();
    isMobileMenuOpen.value = false;
  }
};

onMounted(() => {
  if (typeof window !== "undefined") {
    // Check saved theme or system preference
    const savedTheme = localStorage.getItem("temple_theme") as Theme | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      applyTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("click", handleClickOutside);
    window.removeEventListener("keydown", handleKeyDown);
  }
});
</script>

<template>
  <header
    class="site-header"
    :class="{ 'scrolled-header': isScrolled, 'mobile-menu-active': isMobileMenuOpen }"
  >
    <div class="nav-container">
      <!-- 1. LEFT: Text Logo in Two Lines (No Icon, No Gradient) -->
      <NuxtLink to="/" class="nav-logo" aria-label="Golpahar Mohashoshan Kali Mandir">
        <div class="logo-text-lockup">
          <span class="logo-line-1">Golpahar Mohashoshan</span>
          <span class="logo-line-2">Kali Mandir</span>
        </div>
      </NuxtLink>

      <!-- 2. MIDDLE: Nav Links (Home, About, Deities, Puja [dropdown], Festivals, Gallery, Contact) -->
      <nav class="nav-middle" aria-label="Main Navigation">
        <NuxtLink to="/" class="nav-item" active-class="nav-item-active">
          Home
        </NuxtLink>

        <NuxtLink to="/about" class="nav-item" active-class="nav-item-active">
          About
        </NuxtLink>

        <NuxtLink to="/deities" class="nav-item" active-class="nav-item-active">
          Deities
        </NuxtLink>

        <NuxtLink to="/puja-and-rituals" class="nav-item" active-class="nav-item-active">
          Puja &amp; Rituals
        </NuxtLink>

        <NuxtLink to="/festivals-and-events" class="nav-item" active-class="nav-item-active">
          Festivals
        </NuxtLink>

        <NuxtLink to="/gallery" class="nav-item" active-class="nav-item-active">
          Gallery
        </NuxtLink>

        <NuxtLink to="/contact" class="nav-item" active-class="nav-item-active">
          Contact
        </NuxtLink>
      </nav>

      <!-- 3. RIGHT: Actions (Theme, Language, Direct User Icon) + Mobile Toggle -->
      <div class="nav-actions">
        <!-- 3A. Theme Switcher -->
        <button
          type="button"
          class="action-btn theme-toggle"
          @click="toggleTheme($event)"
          :title="currentTheme === 'dark' ? 'Switch to Sindoor & Gold (Light)' : 'Switch to Midnight & Hibiscus (Dark)'"
          :aria-label="currentTheme === 'dark' ? 'Switch to Sindoor & Gold (Light)' : 'Switch to Midnight & Hibiscus (Dark)'"
        >
          <!-- Sun Icon -->
          <svg
            v-if="currentTheme === 'dark'"
            class="btn-icon sun-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
          <!-- Moon Icon -->
          <svg
            v-else
            class="btn-icon moon-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </button>

        <!-- 3B. Language Switcher (Bengali & English only) -->
        <div class="nav-dropdown-wrapper">
          <button
            type="button"
            class="action-btn lang-toggle nav-dropdown-trigger"
            :class="{ 'btn-active': isLangOpen }"
            @click.stop="toggleLangMenu"
            title="Switch Language"
            aria-label="Switch Language"
            aria-haspopup="true"
            :aria-expanded="isLangOpen"
          >
            <svg
              class="btn-icon globe-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span class="lang-code">{{ currentLang }}</span>
          </button>

          <!-- Language Menu -->
          <Transition name="fade-scale">
            <div v-if="isLangOpen" class="nav-dropdown-menu lang-menu" @click.stop>
              <div class="dropdown-header">Language</div>
              <button
                v-for="lang in languages"
                :key="lang.code"
                type="button"
                class="dropdown-option"
                :class="{ 'option-selected': currentLang === lang.code }"
                @click="setLanguage(lang.code)"
              >
                <div class="lang-option-text">
                  <span class="native-name">{{ lang.nativeName }}</span>
                  <span class="english-name">{{ lang.name }}</span>
                </div>
                <svg
                  v-if="currentLang === lang.code"
                  class="check-icon"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </Transition>
        </div>

        <!-- 3C. User Icon (Direct redirect to Dashboard or Login, no submenu) -->
        <NuxtLink
          to="/admin"
          class="action-btn user-btn"
          title="Admin / Devotee Console"
          aria-label="Admin / Devotee Console"
        >
          <svg
            class="btn-icon user-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </NuxtLink>

        <!-- 3D. Mobile Hamburger Toggle -->
        <button
          type="button"
          class="action-btn mobile-toggle"
          @click="toggleMobileMenu"
          :aria-expanded="isMobileMenuOpen"
          aria-label="Toggle Navigation Menu"
        >
          <svg
            v-if="!isMobileMenuOpen"
            class="btn-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <svg
            v-else
            class="btn-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Slide-Down Drawer -->
    <Transition name="mobile-slide">
      <div v-if="isMobileMenuOpen" class="mobile-drawer" @click.self="isMobileMenuOpen = false">
        <div class="mobile-drawer-content">
          <div class="mobile-nav-links">
            <NuxtLink
              to="/"
              class="mobile-nav-item"
              active-class="mobile-nav-active"
              @click="isMobileMenuOpen = false"
            >
              Home
            </NuxtLink>

            <NuxtLink
              to="/about"
              class="mobile-nav-item"
              active-class="mobile-nav-active"
              @click="isMobileMenuOpen = false"
            >
              About
            </NuxtLink>

            <NuxtLink
              to="/deities"
              class="mobile-nav-item"
              active-class="mobile-nav-active"
              @click="isMobileMenuOpen = false"
            >
              Deities
            </NuxtLink>

            <NuxtLink
              to="/puja-and-rituals"
              class="mobile-nav-item"
              active-class="mobile-nav-active"
              @click="isMobileMenuOpen = false"
            >
              Puja &amp; Rituals
            </NuxtLink>

            <NuxtLink
              to="/festivals-and-events"
              class="mobile-nav-item"
              active-class="mobile-nav-active"
              @click="isMobileMenuOpen = false"
            >
              Festivals
            </NuxtLink>

            <NuxtLink
              to="/gallery"
              class="mobile-nav-item"
              active-class="mobile-nav-active"
              @click="isMobileMenuOpen = false"
            >
              Gallery
            </NuxtLink>

            <NuxtLink
              to="/contact"
              class="mobile-nav-item"
              active-class="mobile-nav-active"
              @click="isMobileMenuOpen = false"
            >
              Contact
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
/* ----------------------------------------------------
   SITE HEADER BASE (Adaptive to Hero Section)
---------------------------------------------------- */
.site-header {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: var(--nav-height, 72px);
  z-index: 1000;
  background-color: transparent;
  border-bottom: 1px solid transparent;
  transition: background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              backdrop-filter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Scrolled or Mobile Drawer Open: Solid Glass Brand Header */
.site-header.scrolled-header,
.site-header.mobile-menu-active {
  background-color: var(--nav-bg-scrolled);
  border-bottom: 1px solid var(--nav-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.nav-container {
  width: 100%;
  max-width: 1320px;
  height: 100%;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 1rem;
    gap: 0.75rem;
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0 0.75rem;
    gap: 0.5rem;
  }
}

/* ----------------------------------------------------
   1. LEFT: LOGO (Two Lines, Text Only, No Icon, No Gradient)
---------------------------------------------------- */
.nav-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
  user-select: none;
  transition: opacity 0.2s ease;
}

.nav-logo:hover {
  opacity: 0.88;
}

.logo-text-lockup {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  line-height: 1.18;
  gap: 2px;
}

.logo-line-1 {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--text-primary);
  white-space: nowrap;
  transition: color 0.25s ease;
}

.logo-line-2 {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--accent-text);
  text-transform: uppercase;
  white-space: nowrap;
  transition: color 0.25s ease;
}

/* Scrolled Logo Colors */
.site-header.scrolled-header .logo-line-1,
.site-header.mobile-menu-active .logo-line-1 {
  color: var(--nav-text, #F7EFE0);
}

.site-header.scrolled-header .logo-line-2,
.site-header.mobile-menu-active .logo-line-2 {
  color: var(--gold, #E0A526);
}

@media (max-width: 480px) {
  .logo-line-1 {
    font-size: 0.925rem;
  }
  .logo-line-2 {
    font-size: 0.725rem;
  }
}

/* ----------------------------------------------------
   2. MIDDLE: NAV LINKS (Adapting to Hero, Scrolled Brand)
---------------------------------------------------- */
.nav-middle {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  flex: 1;
}

@media (min-width: 992px) {
  .nav-middle {
    display: flex;
  }
}

.nav-item {
  color: var(--text-primary);
  text-decoration: none;
  font-size: 0.925rem;
  font-weight: 500;
  padding: 0.45rem 0.75rem;
  margin: 0 0.15rem;
  transition: all 0.2s ease;
  white-space: nowrap;
  background: transparent !important;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: inherit;
  position: relative;
  border-radius: 6px;
  opacity: 0.9;
}

/* Small underline indicator for focused/hover/active states */
.nav-item::after {
  content: "";
  position: absolute;
  bottom: 0px;
  left: 0.75rem;
  right: 0.75rem;
  height: 2px;
  background-color: var(--accent);
  border-radius: 2px;
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-item:hover {
  color: var(--accent);
  background-color: var(--nav-hover-bg) !important;
  opacity: 1;
}

.nav-item:hover::after,
.nav-item:focus-visible::after,
.nav-item-active::after,
.nav-item.dropdown-active::after,
.nav-item.parent-active::after {
  transform: scaleX(1);
}

.nav-item-active,
.nav-item.parent-active {
  color: var(--accent-text) !important;
  font-weight: 700;
  opacity: 1;
  background: transparent !important;
}

/* Scrolled Nav Items */
.site-header.scrolled-header .nav-item,
.site-header.mobile-menu-active .nav-item {
  color: var(--nav-text, #F7EFE0);
}

.site-header.scrolled-header .nav-item:hover,
.site-header.mobile-menu-active .nav-item:hover {
  color: var(--nav-hover-text, var(--gold));
  background-color: var(--nav-hover-bg) !important;
}

.site-header.scrolled-header .nav-item::after,
.site-header.mobile-menu-active .nav-item::after {
  background-color: var(--nav-active-color, var(--gold));
}

.site-header.scrolled-header .nav-item-active,
.site-header.scrolled-header .nav-item.parent-active,
.site-header.mobile-menu-active .nav-item-active,
.site-header.mobile-menu-active .nav-item.parent-active {
  color: var(--nav-active-color, var(--gold)) !important;
}

.chevron-icon {
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}

/* ----------------------------------------------------
   3. RIGHT: ACTION BUTTONS (THEME, LANG, USER)
---------------------------------------------------- */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  font-family: inherit;
}

.action-btn:hover,
.action-btn.btn-active {
  color: var(--accent);
  background-color: var(--action-btn-hover);
  border-color: var(--accent);
  box-shadow: 0 0 12px var(--accent-glow);
  transform: translateY(-1px);
}

.action-btn:active {
  transform: translateY(0);
}

.site-header.scrolled-header .action-btn,
.site-header.mobile-menu-active .action-btn {
  color: var(--nav-text, #F7EFE0);
  border-color: var(--nav-border);
}

.site-header.scrolled-header .action-btn:hover,
.site-header.mobile-menu-active .action-btn:hover {
  color: var(--gold, #E0A526);
  border-color: var(--gold, #E0A526);
}

.site-header.scrolled-header .lang-code,
.site-header.mobile-menu-active .lang-code {
  color: var(--nav-text, #F7EFE0);
}

.btn-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

/* Language toggle button */
.lang-toggle {
  width: auto;
  min-width: 44px;
  height: 40px;
  padding: 0 0.65rem;
  border-radius: 9999px;
  gap: 0.35rem;
}

.lang-code {
  font-size: 0.775rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .logo-line-1 {
    font-size: 0.95rem;
  }
  .logo-line-2 {
    font-size: 0.72rem;
  }
  .nav-actions {
    gap: 0.45rem;
  }
  .action-btn {
    width: 36px;
    height: 36px;
  }
  .lang-toggle {
    min-width: 40px;
    height: 36px;
    padding: 0 0.5rem;
  }
}

@media (max-width: 480px) {
  .logo-line-1 {
    font-size: 0.86rem;
  }
  .logo-line-2 {
    font-size: 0.65rem;
  }
  .nav-actions {
    gap: 0.3rem;
  }
  .action-btn {
    width: 33px;
    height: 33px;
  }
  .btn-icon {
    width: 15px;
    height: 15px;
  }
  .lang-toggle {
    min-width: 34px;
    height: 33px;
    padding: 0 0.4rem;
  }
  .lang-code {
    font-size: 0.7rem;
  }
}

/* Mobile Toggle Hamburger */
.mobile-toggle {
  display: inline-flex;
}

@media (min-width: 992px) {
  .mobile-toggle {
    display: none;
  }
}

/* ----------------------------------------------------
   DROPDOWNS (PUJA & LANGUAGE)
---------------------------------------------------- */
.nav-dropdown-wrapper {
  position: relative;
  display: inline-flex;
}

.nav-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background-color: var(--dropdown-bg);
  border: 1px solid var(--nav-border);
  border-radius: 10px;
  padding: 0.4rem;
  box-shadow: 0 14px 38px -4px rgba(0, 0, 0, 0.35), 0 4px 12px -2px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 1010;
}

/* Puja Dropdown */
.puja-menu {
  width: 190px;
  left: 0;
  right: auto;
}

.dropdown-link {
  display: block;
  padding: 0.55rem 0.85rem;
  color: var(--nav-text, #F7EFE0);
  text-decoration: none;
  font-size: 0.885rem;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.15s ease;
  position: relative;
}

.dropdown-link:hover {
  background-color: var(--nav-hover-bg);
  color: var(--gold, #E0A526);
}

.dropdown-link-active {
  color: var(--gold, #E0A526) !important;
  font-weight: 700;
}

.dropdown-item-text {
  position: relative;
}

/* Language Menu */
.lang-menu {
  width: 180px;
  right: 0;
  left: auto;
}

.dropdown-header {
  padding: 0.4rem 0.75rem 0.35rem;
  font-size: 0.725rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gold, #E0A526);
  opacity: 0.85;
}

.dropdown-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--nav-text, #F7EFE0);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  text-align: left;
}

.dropdown-option:hover {
  background-color: var(--nav-hover-bg);
  color: var(--gold, #E0A526);
}

.dropdown-option.option-selected {
  color: var(--gold, #E0A526);
  font-weight: 700;
}

.lang-option-text {
  display: flex;
  flex-direction: column;
}

.native-name {
  font-size: 0.885rem;
  font-weight: 600;
}

.english-name {
  font-size: 0.725rem;
  color: var(--nav-text);
  opacity: 0.7;
}

.check-icon {
  width: 16px;
  height: 16px;
  color: var(--gold, #E0A526);
}

/* ----------------------------------------------------
   MOBILE DRAWER
---------------------------------------------------- */
.mobile-drawer {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--mobile-drawer-bg);
  border-bottom: 1px solid var(--nav-border);
  max-height: calc(100vh - 70px);
  overflow-y: auto;
}

.mobile-drawer-content {
  width: 100%;
  padding: 1.25rem 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.mobile-nav-item {
  display: block;
  padding: 0.65rem 0.85rem;
  color: var(--nav-text, #F7EFE0);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.mobile-nav-item:hover,
.mobile-nav-item:active {
  color: var(--gold, #E0A526);
  background-color: var(--nav-hover-bg);
}

.mobile-nav-active {
  color: var(--gold, #E0A526) !important;
  font-weight: 700;
  border-left: 3px solid var(--gold, #E0A526);
  padding-left: 0.75rem;
}

/* Mobile Puja subgroup */
.mobile-subgroup {
  padding: 0.35rem 0 0.35rem 0.85rem;
  border-left: 1px dashed var(--nav-border);
  margin-left: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mobile-subgroup-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: var(--gold, #E0A526);
  opacity: 0.85;
  padding: 0.2rem 0.5rem;
}

.mobile-sub-link {
  font-size: 0.9rem;
  padding: 0.45rem 0.5rem;
}

/* ----------------------------------------------------
   ANIMATION TRANSITIONS
---------------------------------------------------- */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}

.mobile-slide-enter-active,
.mobile-slide-leave-active {
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.mobile-slide-enter-from,
.mobile-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
