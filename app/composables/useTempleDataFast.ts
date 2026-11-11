import { computed, watchEffect } from "vue";
import type {
  HeroData,
  DailyEvent,
  PujaOffering,
  SpecialEvent,
  DeitySlide,
  UpcomingFestival,
  TempleNotice,
  DonationData,
  HomePageData,
} from "./useTempleData";
import { initialTempleData } from "./useTempleData";

// Optimized initial dataset pointing to compressed web assets (77% smaller images)
export const initialTempleDataFast: HomePageData = {
  ...initialTempleData,
  deities: [
    {
      id: "shiva",
      name: "Lord Shiva",
      title: "Mahadeva • The Auspicious One",
      description:
        "Revered as the eternal ascetic, supreme source of yogic stillness, compassion, and divine cosmic harmony.",
      image: "/images/optimized/shiva.jpg", // 80 KB instead of 160 KB
    },
    {
      id: "kali",
      name: "Maa Kali",
      title: "Bhavatarini • The Divine Mother",
      description:
        "The fierce and loving eternal protector who dispels ignorance, removes ego, and shields all pure devotees.",
      image: "/images/optimized/kali.jpg", // 83 KB instead of 166 KB
    },
    {
      id: "ganesha",
      name: "Lord Ganesha",
      title: "Vighnaharta • Remover of Obstacles",
      description:
        "Worshipped first across all sacred rites, granting divine wisdom, auspicious beginnings, and spiritual intellect.",
      image: "/images/optimized/ganesha.jpg", // 48 KB
    },
    {
      id: "krishna",
      name: "Shri Radha Krishna",
      title: "Radha Vallabh • Eternal Divine Love",
      description:
        "The eternal embodiment of sacred love, divine melody, spiritual wisdom, and selfless devotional surrender.",
      image: "/images/optimized/krishna.jpg", // 120 KB instead of 153 KB
    },
    {
      id: "lakshmi",
      name: "Maa Lakshmi",
      title: "Sri • Bestower of Purity & Abundance",
      description:
        "The eternal consort of Vishnu, granting spiritual illumination, fortune, auspicious peace, and sacred nourishment.",
      image: "/images/optimized/lakshmi.jpg", // 82 KB instead of 1,313 KB (94% reduction!)
    },
  ],
};

export function useTempleDataFast() {
  // Shared reactive state across components
  const homeData = useState<HomePageData>("temple_home_data_fast", () => initialTempleDataFast);

  // Non-blocking lazy client-side background sync:
  // Immediate instant render using in-memory data, zero SSR delay (instant TTFB)
  const { data: serverData, refresh } = useFetch<HomePageData>("/api/cms/home", {
    key: "cms_home_data_fast",
    default: () => initialTempleDataFast,
    lazy: true,
    server: false,
  });

  // Keep state synchronized with server data
  watchEffect(() => {
    if (serverData.value) {
      homeData.value = {
        ...initialTempleDataFast,
        ...serverData.value,
      };
    }
  });

  const currentData = computed(() => serverData.value || homeData.value || initialTempleDataFast);

  const heroData = computed(() => currentData.value.hero || initialTempleDataFast.hero);
  const dailySchedule = computed(() => currentData.value.dailySchedule || initialTempleDataFast.dailySchedule);
  const pujaOfferings = computed(() => currentData.value.pujaOfferings || initialTempleDataFast.pujaOfferings);
  const specialEvents = computed(() => currentData.value.specialEvents || initialTempleDataFast.specialEvents);
  const deities = computed(() => currentData.value.deities || initialTempleDataFast.deities);
  const upcomingFestivals = computed(() => currentData.value.upcomingFestivals || initialTempleDataFast.upcomingFestivals);
  const templeNotices = computed(() => currentData.value.templeNotices || initialTempleDataFast.templeNotices);
  const donationData = computed(() => currentData.value.donation || initialTempleDataFast.donation);

  return {
    homeData,
    heroData,
    dailySchedule,
    pujaOfferings,
    specialEvents,
    deities,
    upcomingFestivals,
    templeNotices,
    donationData,
    refreshData: refresh,
  };
}
