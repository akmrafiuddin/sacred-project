import { z } from "zod";

export const FONT_OPTIONS_HEADING = [
  "Cinzel",
  "Playfair Display",
  "Lora",
  "Merriweather",
  "Marcellus",
  "Cinzel Decorative",
  "Plus Jakarta Sans",
  "Inter",
] as const;

export const FONT_OPTIONS_BODY = [
  "Plus Jakarta Sans",
  "Inter",
  "Roboto",
  "Open Sans",
  "Noto Sans",
  "Lora",
] as const;

export const THEME_PALETTES = [
  {
    id: "sindoor_gold",
    name: "Sindoor & Gold (Classic Mandir)",
    primary: "#6E0516",
    secondary: "#E0A526",
    accent: "#D97706",
    bg: "#F7EFE0",
  },
  {
    id: "kesari_saffron",
    name: "Kesari Saffron (Vibrant Vedic)",
    primary: "#C2410C",
    secondary: "#F59E0B",
    accent: "#EA580C",
    bg: "#FFFBEB",
  },
  {
    id: "shiva_neel",
    name: "Neelkanth & Silver (Mystical Night)",
    primary: "#1E293B",
    secondary: "#0284C7",
    accent: "#38BDF8",
    bg: "#0F172A",
  },
  {
    id: "maroon_sand",
    name: "Deep Maroon & Sandalwood (Serene Heritage)",
    primary: "#450A0A",
    secondary: "#B45309",
    accent: "#D97706",
    bg: "#FAFAF9",
  },
] as const;

const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export const siteSettingsSchema = z.object({
  brand: z.object({
    siteTitle: z.string().min(1, "Site title is required").max(100),
    siteTagline: z.string().max(200).default(""),
    faviconUrl: z.string().default("/favicon.ico"),
    logoUrl: z.string().default("/images/temple-logo.svg"),
    footerCopyright: z
      .string()
      .default("© 2026 Golpahar Mohashoshan Kali Mandir Committee. All rights reserved."),
  }),
  typography: z.object({
    headingFont: z.string().default("Cinzel"),
    bodyFont: z.string().default("Plus Jakarta Sans"),
    baseFontSize: z.string().default("16px"),
  }),
  theme: z.object({
    colorPalette: z.string().default("sindoor_gold"),
    primaryColor: z
      .string()
      .regex(hexColorRegex, "Invalid primary color hex code")
      .default("#6E0516"),
    secondaryColor: z
      .string()
      .regex(hexColorRegex, "Invalid secondary color hex code")
      .default("#E0A526"),
    accentColor: z
      .string()
      .regex(hexColorRegex, "Invalid accent color hex code")
      .default("#D97706"),
    backgroundColor: z
      .string()
      .regex(hexColorRegex, "Invalid background color hex code")
      .default("#F7EFE0"),
    defaultThemeMode: z.enum(["light", "dark", "system"]).default("light"),
  }),
  social: z.object({
    facebookUrl: z.string().default(""),
    youtubeUrl: z.string().default(""),
    instagramUrl: z.string().default(""),
    whatsappNumber: z.string().default(""),
    twitterUrl: z.string().default(""),
  }),
  contact: z.object({
    email: z.string().email("Invalid email").or(z.literal("")).default("contact@golpaharkalimandir.org"),
    phone: z.string().default("+880 31 654321"),
    address: z.string().default("Golpahar, Mehedibag Road, Chittagong, Bangladesh"),
    googleMapsUrl: z.string().default(""),
  }),
  announcement: z.object({
    enabled: z.boolean().default(false),
    message: z.string().default(""),
    link: z.string().default(""),
  }),
});

export type SiteSettingsData = z.infer<typeof siteSettingsSchema>;

export const defaultSiteSettingsData: SiteSettingsData = {
  brand: {
    siteTitle: "Golpahar Mohashoshan Kali Mandir",
    siteTagline: "A Sacred Haven of Divine Worship, Peace & Heritage in Chittagong",
    faviconUrl: "/favicon.ico",
    logoUrl: "/images/temple-logo.svg",
    footerCopyright: "© 2026 Golpahar Mohashoshan Kali Mandir Committee. All rights reserved.",
  },
  typography: {
    headingFont: "Cinzel",
    bodyFont: "Plus Jakarta Sans",
    baseFontSize: "16px",
  },
  theme: {
    colorPalette: "sindoor_gold",
    primaryColor: "#6E0516",
    secondaryColor: "#E0A526",
    accentColor: "#D97706",
    backgroundColor: "#F7EFE0",
    defaultThemeMode: "light",
  },
  social: {
    facebookUrl: "https://facebook.com/golpaharkalimandir",
    youtubeUrl: "https://youtube.com/@golpaharkalimandir",
    instagramUrl: "https://instagram.com/golpaharkalimandir",
    whatsappNumber: "+880 1819-000000",
    twitterUrl: "https://x.com/golpaharmandir",
  },
  contact: {
    email: "contact@golpaharkalimandir.org",
    phone: "+880 31 654321",
    address: "Golpahar, Mehedibag Road, Chittagong, Bangladesh",
    googleMapsUrl: "https://maps.google.com/?q=Golpahar+Kali+Mandir",
  },
  announcement: {
    enabled: false,
    message: "Welcome to the official portal of Golpahar Mohashoshan Kali Mandir.",
    link: "",
  },
};
