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
  const pillars = computed(() => about.value.pillars);
  const shrines = computed(() => about.value.shrines);
  const administration = computed(() => about.value.administration);
  const guidelines = computed(() => about.value.guidelines);

  return {
    about,
    hero,
    history,
    pillars,
    shrines,
    administration,
    guidelines,
    status,
    refresh,
    error,
  };
};
