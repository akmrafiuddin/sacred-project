export interface AboutHeroData {
  badge: string;
  titleBn: string;
  titleEn: string;
  subtitle: string;
  establishedText: string;
  highlights: string[];
}

export interface HistoricalMilestone {
  period: string;
  title: string;
  description: string;
}

export interface AboutHistorySection {
  tag: string;
  heading: string;
  headingBn: string;
  quote: string;
  quoteAuthor: string;
  narrativeParagraphs: string[];
  milestones: HistoricalMilestone[];
}

export interface SpiritualPillar {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  emphasis: string;
}

export interface TempleShrine {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  significance: string;
}

export interface AdministrationData {
  title: string;
  titleBn: string;
  committeeName: string;
  description: string;
  keyResponsibilities: string[];
  registrationInfo: string;
}

export interface DevoteeGuideline {
  title: string;
  rule: string;
}

export interface AboutPageData {
  hero: AboutHeroData;
  history: AboutHistorySection;
  pillars: SpiritualPillar[];
  shrines: TempleShrine[];
  administration: AdministrationData;
  guidelines: DevoteeGuideline[];
}

export const defaultAboutData: AboutPageData = {
  hero: {
    badge: "Sacred Abode of Divine Mother · Established Heritage",
    titleBn: "শ্রীশ্রী গোলপাহাড় মহাশ্মশান কালী মন্দির",
    titleEn: "Sanctuary of Devotion, Peace & Community",
    subtitle:
      "Perched on the historic hill of Mehedibag in Chittagong, Golpahar Mohashoshan Kali Mandir is a venerable pilgrimage seat dedicated to the worship of Goddess Kali, the observance of sacred Vedic rites, and unwavering selfless service to humanity.",
    establishedText: "Over a century of spiritual tradition in Chittagong, Bangladesh",
    highlights: [
      "Historic Mahashoshan Peeth",
      "Daily Nitya Puja & Three Sacred Aartis",
      "Wholesome Annadanam Seva",
      "Antim Sanskar Rites with Full Vedic Dignity",
    ],
  },
  history: {
    tag: "Sacred Origins & Significance",
    heading: "The Heritage of Golpahar Mohashoshan",
    headingBn: "মহাশ্মশানের ঐতিহ্য ও আধ্যাত্মিক মাহাত্ম্য",
    quote:
      "Where all worldly vanity dissolves, divine consciousness awakes. Mother Kali in the Mahashoshan is not terror, but the supreme mother who burns away mortality and grants eternal liberation.",
    quoteAuthor: "Traditional Sadhaka Proverb",
    narrativeParagraphs: [
      "The sanctified land of Golpahar (গোলপাহাড়), situated at the heart of Chittagong near Mehedibag and O.R. Nizam Road, has served as a revered spiritual ground for generations. Originally an elevated forest hermitage where wandering ascetics and Tantric sadhakas engaged in deep contemplation, the site was consecrated as a sacred Mahashoshan (cremation sanctuary) where the eternal cycle of life, dissolution, and divine union is witnessed daily.",
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
  pillars: [
    {
      id: "devotion",
      title: "Unbroken Devotion & Ritual Purity",
      titleBn: "নিত্য পূজা ও শাস্ত্রীয় উপাসনা",
      description:
        "Upholding uninterrupted daily worship with Mangal Aarti at dawn, Madhyanha Bhog at noon, and Sandhya Aarti at dusk, strictly following authentic scriptural disciplines.",
      emphasis: "Daily Aarti & Sacred Offerings",
    },
    {
      id: "seva",
      title: "Annadanam & Humanitarian Seva",
      titleBn: "অন্নদান ও মানবসেবা",
      description:
        "Providing warm sanctified prasad to pilgrims, destitute families, and visitors without prejudice of caste, religion, or background every single day.",
      emphasis: "Serving Over 10,000 Monthly Meals",
    },
    {
      id: "antim-sanskar",
      title: "Sanctity of Antim Sanskar",
      titleBn: "অন্ত্যেষ্টিক্রিয়া ও মহাশ্মশান সেবা",
      description:
        "Performing last rites and traditional cremation ceremonies with profound spiritual dignity, empathy for grieving families, and scriptural accuracy.",
      emphasis: "24/7 Priest & Rites Assistance",
    },
    {
      id: "harmony",
      title: "Social Harmony & Universal Peace",
      titleBn: "সম্প্রীতি ও সার্বজনীন কল্যাণ",
      description:
        "Fostering universal brotherhood, moral upliftment, and peaceful coexistence, serving as a beacon of interfaith harmony in the historic port city of Chittagong.",
      emphasis: "Open Doors to All Well-Wishers",
    },
  ],
  shrines: [
    {
      id: "kali-shrine",
      name: "The Sanctum Sanctorum of Mother Kali",
      nameBn: "শ্রীশ্রী দক্ষিণাকালী গর্ভগৃহ",
      description:
        "The primary altar housing the radiant, awakened Vigraha of Mother Kali, adorned in traditional sindoor, flowers, and silver ornaments.",
      significance: "Core focal point of daily worship, Sankalpa pujas, and Deepannita Kali Puja festival.",
    },
    {
      id: "shiva-mandir",
      name: "Sri Sri Baba Bholanath Shiva Mandir",
      nameBn: "শ্রীশ্রী ভোলানাথ শিব মন্দির",
      description:
        "Dedicated shrine featuring the sacred Shivalinga and Nandi bull, symbolizing consciousness, auspiciousness, and ascetic tranquility.",
      significance: "Site of daily Rudrabhishek and massive gatherings during Maha Shivaratri.",
    },
    {
      id: "nat-mandir",
      name: "Nat Mandir & Kirtan Pavilion",
      nameBn: "নাটমন্দির ও কীর্তন প্রাঙ্গণ",
      description:
        "A spacious open-air pillared hall where devotees gather for group bhajans, Harinam Sankirtan, religious discourses, and community prayers.",
      significance: "Seats hundreds of devotees in serene devotion sheltered from the elements.",
    },
    {
      id: "annadanam-bhavan",
      name: "Annadanam Hall & Prasad Altar",
      nameBn: "অন্নদান ভবন ও ভাণ্ডার",
      description:
        "The communal dining and preparation pavilion where sacred Mahaprasad is prepared in pristine conditions and served to all pilgrims.",
      significance: "Operational 365 days a year as a selfless tribute to Mother Annapurna.",
    },
  ],
  administration: {
    title: "Temple Governance & Administration",
    titleBn: "মন্দির পরিচালনা পরিষদ ও ট্রাস্ট",
    committeeName: "Golpahar Mohashoshan Porichalona Porishod (রেজিস্টার্ড পরিচালনা পরিষদ)",
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
  guidelines: [
    {
      title: "Modest Attire",
      rule: "Devotees are requested to wear modest and respectful traditional clothing when entering the sacred temple sanctum.",
    },
    {
      title: "Footwear & Cleanliness",
      rule: "Please deposit footwear at the designated counter before stepping onto the temple marble courtyard.",
    },
    {
      title: "Sanctum Photography",
      rule: "Photography of the inner deity altar during intimate aartis is restricted to maintain sanctity and devotee privacy.",
    },
    {
      title: "Offerings & Samagri",
      rule: "Devotees wishing to offer coconuts, flowers, or sweets may approach the on-duty priest at the designated puja counter.",
    },
    {
      title: "Peaceful Demeanor",
      rule: "Maintain a quiet, contemplative atmosphere inside the prayer hall and kindly switch mobile phones to silent mode.",
    },
  ],
};
