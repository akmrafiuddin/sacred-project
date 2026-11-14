<script setup lang="ts">
const currentYear = new Date().getFullYear();

// Menu items
const menuLinks = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Deities", path: "/deities" },
  { name: "Puja & Rituals", path: "/puja-and-rituals" },
  { name: "Puja List & Charges", path: "/puja-list-and-charges" },
  { name: "Festivals", path: "/festivals-and-events" },
  { name: "Gallery", path: "/gallery" },
  { name: "Contact", path: "/contact" },
  { name: "Sitemap", path: "/sitemap" },
];

const scrollToTop = () => {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};
</script>

<template>
  <footer class="site-footer" aria-label="Site Footer">
    <div class="footer-container">
      <div class="footer-grid">
        <!-- COLUMN 1: Header, Subtitle, Social Media Buttons -->
        <div class="footer-col brand-col">
          <NuxtLink to="/" class="footer-logo" aria-label="Golpahar Mohashoshan Kali Mandir">
            <div class="logo-text-lockup">
              <span class="logo-line-1">Golpahar Mohashoshan</span>
              <span class="logo-line-2">Kali Mandir</span>
            </div>
          </NuxtLink>

          <p class="footer-desc">
            An abode of eternal devotion, Vedic rites, and inner peace. Serving pilgrims and community through daily divine darshan, wholesome Annadanam, and timeless sacred heritage.
          </p>

          <!-- Social Media Buttons -->
          <div class="social-links" aria-label="Social media channels">
            <!-- YouTube (Live Darshan) -->
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              class="social-btn"
              aria-label="YouTube Live Aarti Stream"
              title="YouTube Live Aarti"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>

            <!-- Facebook -->
            <a
              href="https://www.facebook.com/p/Golpahar-Mohashmoshan-Porichalona-Porishod-100064412902552/"
              target="_blank"
              rel="noopener noreferrer"
              class="social-btn"
              aria-label="Facebook Page"
              title="Facebook Community"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            <!-- WhatsApp Helpline -->
            <a
              href="https://whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              class="social-btn"
              aria-label="WhatsApp Devotee Helpline"
              title="Devotee WhatsApp Desk"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </a>
          </div>
        </div>

        <!-- COLUMN 2: Menu Items -->
        <div class="footer-col menu-col">
          <h3 class="col-heading">Navigation</h3>
          <ul class="footer-menu">
            <li v-for="link in menuLinks" :key="link.path" class="menu-item">
              <NuxtLink :to="link.path" class="footer-link">
                {{ link.name }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- COLUMN 3: Contact & Location -->
        <div class="footer-col contact-col">
          <h3 class="col-heading">Contact &amp; Location</h3>

          <div class="contact-entries">
            <!-- Address -->
            <div class="contact-item">
              <div class="contact-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 21s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div class="contact-text">
                <span class="contact-label">Location</span>
                <span class="contact-val">Golpahar moor, O R nizam road, Chittagong, Bangladesh</span>
              </div>
            </div>

            <!-- Phone -->
            <div class="contact-item">
              <div class="contact-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div class="contact-text">
                <span class="contact-label">Devotee Desk</span>
                <a href="tel:+8801700000000" class="contact-link">+880 2-41356335</a>
              </div>
            </div>

            <!-- Email -->
            <div class="contact-item">
              <div class="contact-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div class="contact-text">
                <span class="contact-label">Office Inquiries</span>
                <a href="mailto:office@templesanctuary.org" class="contact-link">office@mail.example</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="footer-bottom">
        <p class="copyright-text">
          &copy; {{ currentYear }} Golpahar Mohashoshan Kali Mandir Trust. All rights reserved. &bull;
          <NuxtLink to="/sitemap" class="footer-sitemap-link">Sitemap</NuxtLink>
        </p>

        <button type="button" class="back-to-top" aria-label="Scroll back to top" @click="scrollToTop">
          <span>Back to Top</span>
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M14.707 12.707a1 1 0 011.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  width: 100%;
  background-color: var(--footer-bg);
  padding: 5.5rem 2rem 2.5rem;
  color: var(--footer-text);
  position: relative;
  transition: background-color 0.25s ease, color 0.25s ease;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3.5rem;
  padding-bottom: 4rem;
  border-bottom: 1px solid var(--footer-border);
}

@media (min-width: 960px) {
  .footer-grid {
    grid-template-columns: 1.4fr 1.15fr 1.25fr;
    gap: 4.5rem;
  }
}

/* 1. BRAND COLUMN */
.brand-col {
  display: flex;
  flex-direction: column;
}

.footer-logo {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  margin-bottom: 1.25rem;
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
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--footer-text);
  white-space: nowrap;
}

.logo-line-2 {
  font-size: 0.825rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--footer-heading);
  text-transform: uppercase;
  white-space: nowrap;
}

.footer-desc {
  font-size: 0.925rem;
  line-height: 1.65;
  color: var(--footer-text-muted);
  max-width: 380px;
  margin: 0 0 2rem;
}

/* Social Media Buttons */
.social-links {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.social-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(224, 165, 38, 0.08);
  border: 1px solid var(--footer-border);
  color: var(--footer-heading);
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.social-btn svg {
  width: 17px;
  height: 17px;
}

.social-btn:hover {
  background: var(--footer-heading);
  border-color: var(--footer-heading);
  color: var(--footer-bg);
  transform: translateY(-2px);
  box-shadow: 0 4px 14px var(--accent-glow);
}

/* 2. MENU COLUMN */
.col-heading {
  font-size: 0.925rem;
  font-weight: 700;
  color: var(--footer-heading);
  letter-spacing: 0.06em;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
}

.footer-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1.5rem;
}

.menu-item {
  display: flex;
}

.footer-link {
  font-size: 0.9rem;
  color: var(--footer-text-muted);
  text-decoration: none;
  transition: all 0.15s ease;
  line-height: 1.4;
}

.footer-link:hover {
  color: var(--footer-heading);
  transform: translateX(2px);
}

/* 3. CONTACT COLUMN */
.contact-entries {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.contact-icon {
  width: 19px;
  height: 19px;
  color: var(--footer-heading);
  margin-top: 0.15rem;
  flex-shrink: 0;
}

.contact-icon svg {
  width: 100%;
  height: 100%;
}

.contact-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.contact-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
  color: var(--footer-heading);
  opacity: 0.85;
}

.contact-val {
  font-size: 0.9rem;
  color: var(--footer-text);
  line-height: 1.4;
}

.contact-link {
  font-size: 0.9rem;
  color: var(--footer-text);
  text-decoration: none;
  transition: color 0.15s ease;
}

.contact-link:hover {
  color: var(--footer-heading);
}

/* BOTTOM BAR */
.footer-bottom {
  padding-top: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.25rem;
  font-size: 0.825rem;
}

.copyright-text {
  color: var(--text-muted);
  margin: 0;
}

.footer-sitemap-link {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.15s ease;
}

.footer-sitemap-link:hover {
  color: var(--accent);
  text-decoration: underline;
}

.bottom-trust-note {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.back-to-top {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  transition: all 0.15s ease;
  font-family: inherit;
}

.back-to-top svg {
  width: 16px;
  height: 16px;
  transition: transform 0.15s ease;
}

.back-to-top:hover {
  color: var(--accent);
}

.back-to-top:hover svg {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .site-footer {
    padding: 4rem 1.25rem 2rem;
  }

  .footer-grid {
    gap: 2.75rem;
    padding-bottom: 2.75rem;
  }

  .footer-menu {
    grid-template-columns: 1fr;
    gap: 0.65rem;
  }

  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>