import { computed } from "vue";
import { defaultAboutData, type AboutPageData } from "~~/server/cms/aboutDefaults";

export const useAboutData = () => {
  const { data, status, refresh, error } = useFetch<AboutPageData>("/api/cms/about", {
    key: "temple_about_page_data",
    default: () => defaultAboutData,
    lazy: false,
  });

  const about = computed<AboutPageData>(() => data.value || defaultAboutData);
  const hero = computed(() => about.value.hero);
  const history = computed(() => about.value.history);
  const administration = computed(() => about.value.administration);
  const images = computed(() => about.value.images || []);

  return {
    about,
    hero,
    history,
    administration,
    images,
    status,
    refresh,
    error,
  };
};
