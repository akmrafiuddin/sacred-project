export interface HeroData {
  titleLine1: string;
  titleHighlight: string;
  subtitle: string;
  scheduleTitle: string;
  scheduleTime: string;
  firstCtaText: string;
  firstCtaLink: string;
  secondCtaText: string;
  secondCtaLink: string;
}

export interface DailyEvent {
  step: string;
  time: string;
  title: string;
  description: string;
}

export interface PujaOffering {
  id: string;
  number: string;
  title: string;
  description: string;
  offered: string;
  price: string;
  duration: string;
}

export interface SpecialEvent {
  id: string;
  dateStr: string; // YYYY-MM-DD
  title: string;
  tithi: string;
  time?: string;
  description: string;
  badge?: string;
}

export interface DeitySlide {
  id: string;
  name: string;
  title: string;
  description: string;
  image: string;
}

export interface UpcomingFestival {
  id: string;
  name: string;
  date: string;
  month: string;
  day: string;
  tithi: string;
  description: string;
}

export interface TempleNotice {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
}

export interface DonationData {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  firstCtaText: string;
  firstCtaLink: string;
  secondCtaText: string;
  secondCtaLink: string;
  trustBadge: string;
}

export interface HomePageData {
  hero: HeroData;
  dailySchedule: DailyEvent[];
  pujaOfferings: PujaOffering[];
  specialEvents: SpecialEvent[];
  deities: DeitySlide[];
  upcomingFestivals: UpcomingFestival[];
  templeNotices: TempleNotice[];
  donation: DonationData;
}

export const defaultHomeData: HomePageData = {
  hero: {
    titleLine1: "Golpahar Mohashoshan",
    titleHighlight: "Kali Mandir",
    subtitle:
      "A place of prayer, peace and community. Dedicated to divine worship, spiritual awakening, and selfless social welfare in Chittagong.",
    scheduleTitle: "Sandhya Aarti",
    scheduleTime: "Today at 6:30 PM",
    firstCtaText: "Book a Puja",
    firstCtaLink: "/puja-list-and-charges",
    secondCtaText: "Plan A Visit",
    secondCtaLink: "/contact",
  },
  dailySchedule: [
    {
      step: "01",
      time: "5:00 am",
      title: "Mangal aarti",
      description: "The first bell. The sanctum is opened, the lamp lit, and the mother woken.",
    },
    {
      step: "02",
      time: "7:00 am",
      title: "Nitya puja",
      description: "The daily worship: bathing, dressing, flowers, incense and the morning bhog.",
    },
    {
      step: "03",
      time: "12:30 pm",
      title: "Bhog",
      description: "Rice, dal, vegetables and sweets are offered, then shared with devotees in the hall.",
    },
    {
      step: "04",
      time: "6:30 pm",
      title: "Sandhya aarti",
      description: "The evening lamp, the conch and the loud bell. The temple's busiest half hour.",
    },
    {
      step: "05",
      time: "9:30 pm",
      title: "Shayan aarti",
      description: "The last offering of the day. The sanctum is closed for the night.",
    },
  ],
  pujaOfferings: [
    {
      id: "nitya-puja",
      number: "01",
      title: "Nitya puja",
      description: "The daily worship, offered on your behalf with your name and gotra read in the sankalpa.",
      offered: "Flowers, bel patra, incense, bhog and prasad",
      price: "৳501",
      duration: "45 minutes",
    },
    {
      id: "satyanarayan-puja",
      number: "02",
      title: "Satyanarayan puja",
      description: "For a vow kept, a home blessed, or a promise fulfilled. Performed with the Satyanarayan katha.",
      offered: "Fruit, panchamrit, sweets and prasad for the household",
      price: "৳1,501",
      duration: "2 hours",
    },
    {
      id: "rudrabhishek",
      number: "03",
      title: "Rudrabhishek",
      description: "Milk, honey and water poured over the Shiva lingam while the Rudram is chanted.",
      offered: "All samagri, flowers and prasad",
      price: "৳2,001",
      duration: "1 hour 30 minutes",
    },
    {
      id: "kali-puja",
      number: "04",
      title: "Kali puja (individual)",
      description: "An individual Kali puja on the temple's Kali Puja night, with your name in the sankalpa.",
      offered: "Hibiscus, sindoor, lamps, prasad",
      price: "৳2,501",
      duration: "1 hour",
    },
  ],
  specialEvents: [
    {
      id: "sp-1",
      dateStr: "2026-11-10",
      title: "Special Kali Aradhana & Deepam",
      tithi: "Kartika Shukla Pratipada",
      time: "7:00 PM",
      description: "Special evening pancha-pradip offering, Chandi stotram recital, and sanctified mahaprasad.",
      badge: "Special Puja",
    },
    {
      id: "sp-2",
      dateStr: "2026-11-12",
      title: "Utpanna Ekadashi Vrata",
      tithi: "Kartika Shukla Ekadashi",
      time: "5:30 AM & 6:00 PM",
      description: "Special early darshan, continuous Vishnu Sahasranama chanting, and fruit offerings.",
      badge: "Holy Vrata",
    },
    {
      id: "sp-3",
      dateStr: "2026-11-18",
      title: "Gopashtami Go-Puja",
      tithi: "Kartika Shukla Ashtami",
      time: "9:00 AM",
      description: "Special morning cow worship ceremony, grass offering, and sacred hymns.",
      badge: "Temple Tradition",
    },
    {
      id: "sp-4",
      dateStr: "2026-11-24",
      title: "Kartika Purnima Maha Deepotsav",
      tithi: "Kartika Purnima",
      time: "6:00 PM - 10:00 PM",
      description: "Lighting of 1,008 earthen lamps, sacred conch resonance, and special Ganga aarti style darshan.",
      badge: "Major Festival",
    },
  ],
  deities: [
    {
      id: "shiva",
      name: "Lord Shiva",
      title: "Mahadeva • The Auspicious One",
      description:
        "Revered as the eternal ascetic, supreme source of yogic stillness, compassion, and divine cosmic harmony.",
      image: "/images/deities/shiva.jpg",
    },
    {
      id: "kali",
      name: "Maa Kali",
      title: "Bhavatarini • The Divine Mother",
      description:
        "The fierce and loving eternal protector who dispels ignorance, removes ego, and shields all pure devotees.",
      image: "/images/deities/kali.jpg",
    },
    {
      id: "ganesha",
      name: "Lord Ganesha",
      title: "Vighnaharta • Remover of Obstacles",
      description:
        "Worshipped first across all sacred rites, granting divine wisdom, auspicious beginnings, and spiritual intellect.",
      image: "/images/deities/ganesha.jpg",
    },
    {
      id: "krishna",
      name: "Shri Radha Krishna",
      title: "Radha Vallabh • Eternal Divine Love",
      description:
        "The eternal embodiment of sacred love, divine melody, spiritual wisdom, and selfless devotional surrender.",
      image: "/images/deities/krishna.jpg",
    },
    {
      id: "lakshmi",
      name: "Maa Lakshmi",
      title: "Sri • Bestower of Purity & Abundance",
      description:
        "The eternal consort of Vishnu, granting spiritual illumination, fortune, auspicious peace, and sacred nourishment.",
      image: "/images/deities/lakshmi.jpg",
    },
  ],
  upcomingFestivals: [
    {
      id: "maha-shivaratri",
      name: "Maha Shivaratri",
      date: "March 8, 2026",
      month: "MAR",
      day: "08",
      tithi: "Phalguna Krishna Chaturdashi",
      description: "All-night continuous abhishekam, Rudram chanting, special Maha Aarti, and devotee vigil.",
    },
    {
      id: "dol-purnima",
      name: "Dol Purnima (Holi)",
      date: "March 25, 2026",
      month: "MAR",
      day: "25",
      tithi: "Phalguna Shukla Purnima",
      description: "Morning abir offering to Sri Radha Krishna, devotional kirtan, and sacred sweets distribution.",
    },
    {
      id: "rama-navami",
      name: "Sri Rama Navami",
      date: "April 17, 2026",
      month: "APR",
      day: "17",
      tithi: "Chaitra Shukla Navami",
      description: "Midday Janmotsav aarti, Ramayana path recitation, and community Annadanam feast.",
    },
    {
      id: "guru-purnima",
      name: "Guru Purnima",
      date: "July 21, 2026",
      month: "JUL",
      day: "21",
      tithi: "Ashadha Shukla Purnima",
      description: "Special morning puja and paduka archana honoring sacred Vedic preceptors and spiritual lineage.",
    },
  ],
  templeNotices: [
    {
      id: "notice-1",
      title: "Special Early Darshan Hours for Ekadashi",
      date: "Nov 12, 2026",
      category: "Schedule",
      summary:
        "Temple gates will open at 4:30 AM for early morning abhishekam and special darshan. Devotees are requested to arrive early.",
    },
    {
      id: "notice-2",
      title: "Devotee Seva Volunteer Registration Open",
      date: "Nov 18, 2026",
      category: "Seva",
      summary:
        "Registration is now open for volunteers to assist in Annadanam food distribution, crowd coordination, and festival seva.",
    },
    {
      id: "notice-3",
      title: "Annadanam Hall Upgrades in Progress",
      date: "Nov 24, 2026",
      category: "Facility",
      summary:
        "The Annadanam dining hall is undergoing expansion. Daily prasad distribution continues in the adjacent covered courtyard.",
    },
    {
      id: "notice-4",
      title: "Winter Blanket Distribution Drive",
      date: "Dec 02, 2026",
      category: "Welfare",
      summary:
        "The temple trust is organizing a winter relief drive for underprivileged families in Chittagong. Contributions are welcome.",
    },
  ],
  donation: {
    badge: "Sacred Giving • Seva",
    title: "Support the Sanctum & Partake in",
    titleHighlight: "Sacred Seva",
    subtitle:
      "Every sacred offering directly nourishes devotees through daily Annadanam, sustains Vedic worship and aartis, and helps preserve our holy sanctuary for generations to come.",
    firstCtaText: "Make an Offering",
    firstCtaLink: "/donation",
    secondCtaText: "Explore All Seva Causes",
    secondCtaLink: "/donation",
    trustBadge: "Official Temple Trust • 100% Transparency",
  },
};
