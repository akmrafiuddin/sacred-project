export interface SitemapLink {
  title: string;
  path: string;
  description: string;
  badge?: string;
}

export interface SitemapCategory {
  id: string;
  title: string;
  description: string;
  links: SitemapLink[];
}

export const sitemapCategories: SitemapCategory[] = [
  {
    id: "sanctuary",
    title: "Sanctuary & Sacred Heritage",
    description: "Explore the temple history, presiding deities, sacred lore, and holy visual chronicles.",
    links: [
      {
        title: "Home",
        path: "/",
        description: "Sanctuary welcome, daily devotional highlights, next aarti countdown, and notices.",
      },
      {
        title: "About the Mandir",
        path: "/about",
        description: "130+ years sacred heritage, holy origins, trusteeship committee, and spiritual lineage.",
      },
      {
        title: "Sacred Deities & Shrines",
        path: "/deities",
        description: "Divine darshan of Maa Kali, Lord Shiva, Radha Krishna, and sacred altars.",
      },
      {
        title: "Mandir History",
        path: "/history",
        description: "Historical chronology, divine lore, and the spiritual roots of Golpahar hill.",
      },
      {
        title: "Holy Gallery & Darshan",
        path: "/gallery",
        description: "Visual chronicles of temple sanctum, daily darshan, and festive celebrations.",
      },
    ],
  },
  {
    id: "worship",
    title: "Pujas, Offerings & Devotee Services",
    description: "Daily rituals, personalized sankalpa offerings, and booking verification for pilgrims.",
    links: [
      {
        title: "Daily Pujas & Rituals",
        path: "/puja-and-rituals",
        description: "Aarti timings, daily nitya rituals, samagri requirements, and sacred guidelines.",
      },
      {
        title: "Book a Puja",
        path: "/puja-booking",
        description: "Reserve standard pujas, custom rituals, special sankalpa, and priest coordination.",
        badge: "Devotee Service",
      },
      {
        title: "Track Booking Status",
        path: "/booking-status",
        description: "Look up confirmation status, priest notes, and schedule details using your reference code.",
        badge: "Lookup Tool",
      },
      {
        title: "Puja List & Dakshina Rates",
        path: "/puja-list-and-charges",
        description: "Complete list of holy pujas, offerings, and prescribed dakshina guidelines.",
      },
    ],
  },
  {
    id: "community",
    title: "Festivals, Announcements & Help",
    description: "Participate in holy festivals, stay informed with notices, or reach the temple office.",
    links: [
      {
        title: "Festivals & Sacred Events",
        path: "/festivals-and-events",
        description: "Annual Kali Puja, Navratri, Maha Shivratri, and sacred auspicious calendar.",
      },
      {
        title: "Notices & Announcements",
        path: "/notice-news",
        description: "Official executive bulletins, schedule updates, and special announcements.",
      },
      {
        title: "Contact & Pilgrim Help",
        path: "/contact",
        description: "Temple address, devotee helpline numbers, map directions, and inquiry form.",
      },
      {
        title: "Annadanam & Seva",
        path: "/donation",
        description: "Sacred food distribution, temple preservation, and pious seva contributions.",
      },
    ],
  },
  {
    id: "portals",
    title: "Devotee & Administrative Portals",
    description: "Dedicated account and administrative portals for devotees and temple staff.",
    links: [
      {
        title: "Devotee Account",
        path: "/account",
        description: "Devotee login portal to manage your contact details, bookings, and visitation passes.",
      },
      {
        title: "Temple Staff & Office Login",
        path: "/admin/login",
        description: "Administrative access for temple trustees, priests, and authorized managers.",
        badge: "Staff Only",
      },
    ],
  },
];
