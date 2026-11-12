export interface AboutHeroData {
  badge: string;
  title: string;
  subtitle: string;
  establishedText: string;
}

export interface HistoricalMilestone {
  period: string;
  title: string;
  description: string;
}

export interface AboutHistorySection {
  tag: string;
  heading: string;
  quote: string;
  quoteAuthor: string;
  narrativeParagraphs: string[];
  milestones: HistoricalMilestone[];
}

export interface AdministrationData {
  title: string;
  committeeName: string;
  description: string;
  keyResponsibilities: string[];
  registrationInfo: string;
}

export interface AboutSliderImage {
  url: string;
  alt?: string;
  caption?: string;
}

export interface AboutPageData {
  hero: AboutHeroData;
  history: AboutHistorySection;
  administration: AdministrationData;
  images?: AboutSliderImage[];
}

export const defaultAboutData: AboutPageData = {
  hero: {
    badge: "Sacred Abode of Divine Mother · Established Heritage",
    title: "Sanctuary of Devotion, Peace & Community",
    subtitle:
      "Perched on the historic hill of Mehedibag in Chittagong, Golpahar Mohashoshan Kali Mandir is a venerable pilgrimage seat dedicated to the worship of Goddess Kali, the observance of sacred Vedic rites, and unwavering selfless service to humanity.",
    establishedText: "Over a century of spiritual tradition in Chittagong, Bangladesh",
  },
  history: {
    tag: "Sacred Origins & Significance",
    heading: "The Heritage of Golpahar Mohashoshan",
    quote:
      "Where all worldly vanity dissolves, divine consciousness awakes. Mother Kali in the Mahashoshan is not terror, but the supreme mother who burns away mortality and grants eternal liberation.",
    quoteAuthor: "Traditional Sadhaka Proverb",
    narrativeParagraphs: [
      "The sanctified land of Golpahar, situated at the heart of Chittagong near Mehedibag and O.R. Nizam Road, has served as a revered spiritual ground for generations. Originally an elevated forest hermitage where wandering ascetics and Tantric sadhakas engaged in deep contemplation, the site was consecrated as a sacred Mahashoshan (cremation sanctuary) where the eternal cycle of life, dissolution, and divine union is witnessed daily.",
      "The manifestation of Divine Mother Kali at Golpahar embodies Her compassionate, protective, and fear-dispelling grace. Devotees from across Bangladesh and the subcontinent journey to the Mandir seeking spiritual solace, refuge in times of adversity, and blessings for peace, good health, and family prosperity.",
      "Over the decades, through the devotion of pilgrims and the dedicated stewardship of the Golpahar Mohashoshan Porichalona Porishod, the hermitage transformed into a tranquil spiritual complex with sanctified shrines, a spacious Nat Mandir, devotee assembly halls, and an active Annadanam Bhavan serving daily prasad to all who enter.",
    ],
    milestones: [
      {
        period: "Late 19th Century",
        title: "Sacred Consecration of the Hilltop",
        description:
          "Sadhus and local devotees consecrate the elevated ground as a dedicated Mahashoshan and hermitage for Mother Kali.",
      },
      {
        period: "Mid 20th Century",
        title: "Temple Expansion & Nat Mandir",
        description:
          "Construction of the main temple sanctum, Shiva shrine, and prayer courtyard accommodating growing numbers of pilgrims.",
      },
      {
        period: "Recent Era",
        title: "Modern Seva Complex & Annadanam",
        description:
          "Establishment of daily Annadanam prasad distribution, digitized devotee services, and modern pilgrim amenities under the Porichalona Porishod.",
      },
    ],
  },
  administration: {
    title: "Temple Governance & Administration",
    committeeName: "Golpahar Mohashoshan Porichalona Porishod (Registered Trust)",
    description:
      "The temple is responsibly administered by a dedicated governing body comprising senior community trustees, spiritual advisors, and active volunteer committees. All financial offerings, development projects, and seva funds are managed with transparent bookkeeping and audited accounting.",
    keyResponsibilities: [
      "Maintenance of sanctum purity and regular priest oversight",
      "Coordination of major festivals (Kali Puja, Shivaratri, Navaratri, Chaitra Sankranti)",
      "Daily execution of Annadanam and free meal distributions",
      "Supervision of cremation grounds and respectful funeral assistance",
      "Preservation of temple heritage archives and devotee facilities",
    ],
    registrationInfo: "Recognized religious and welfare trust in Chittagong, Bangladesh.",
  },
  images: [],
};
