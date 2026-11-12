import { describe, it, expect } from "bun:test";

interface RawServerDeity {
  id: number;
  slug: string;
  name: { en: string; bn: string } | string;
  subtitle?: { en: string; bn: string } | string | null;
  description: { en: string; bn: string } | string;
  imageId?: string | null;
  image?: string;
  sortOrder: number;
  active: boolean;
}

interface NormalizedDeity {
  id: number | string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  image: string;
  sortOrder: number;
}

function normalizeDeities(items: RawServerDeity[]): NormalizedDeity[] {
  return items
    .filter((item) => item.active !== false)
    .map((item) => ({
      id: item.id || item.slug,
      slug: item.slug || "",
      name:
        typeof item.name === "object"
          ? item.name?.en || item.name?.bn || "Sacred Deity"
          : item.name || "Sacred Deity",
      subtitle:
        typeof item.subtitle === "object"
          ? item.subtitle?.en || item.subtitle?.bn || ""
          : item.subtitle || "",
      description:
        typeof item.description === "object"
          ? item.description?.en || item.description?.bn || ""
          : item.description || "",
      image: item.imageId || item.image || "/images/deities/kali.jpg",
      sortOrder: item.sortOrder ?? 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

describe("Deities Page UI Data Normalization & Business Logic", () => {
  it("normalizes localized server deity objects into clean English display items", () => {
    const rawData: RawServerDeity[] = [
      {
        id: 2,
        slug: "kali",
        name: { en: "Maa Kali", bn: "মা কালী" },
        subtitle: { en: "Bhavatarini • The Divine Mother", bn: "" },
        description: { en: "The fierce and loving eternal protector.", bn: "" },
        imageId: "/images/deities/kali.jpg",
        sortOrder: 2,
        active: true,
      },
      {
        id: 1,
        slug: "shiva",
        name: { en: "Lord Shiva", bn: "মহাদেব" },
        subtitle: { en: "Mahadeva • The Auspicious One", bn: "" },
        description: { en: "Revered as the eternal ascetic.", bn: "" },
        imageId: "/images/deities/shiva.jpg",
        sortOrder: 1,
        active: true,
      },
      {
        id: 3,
        slug: "hidden-deity",
        name: { en: "Hidden Sacred Shrine", bn: "" },
        description: { en: "Under renovation", bn: "" },
        sortOrder: 3,
        active: false,
      },
    ];

    const result = normalizeDeities(rawData);

    // Inactive deity must be filtered out
    expect(result.length).toBe(2);

    // Items must be sorted by sortOrder ascending
    expect(result[0].name).toBe("Lord Shiva");
    expect(result[0].slug).toBe("shiva");
    expect(result[0].sortOrder).toBe(1);

    expect(result[1].name).toBe("Maa Kali");
    expect(result[1].slug).toBe("kali");
    expect(result[1].sortOrder).toBe(2);
  });

  it("handles missing images and fallback gracefully", () => {
    const itemWithoutImage: RawServerDeity[] = [
      {
        id: 10,
        slug: "new-shrine",
        name: { en: "Shree Krishna", bn: "" },
        description: { en: "Sacred shrine", bn: "" },
        sortOrder: 1,
        active: true,
      },
    ];

    const result = normalizeDeities(itemWithoutImage);
    expect(result.length).toBe(1);
    expect(result[0].image).toBe("/images/deities/kali.jpg");
  });

  it("handles plain string names and null subtitles", () => {
    const rawData: any[] = [
      {
        id: 11,
        slug: "ganesha",
        name: "Lord Ganesha",
        subtitle: null,
        description: "Remover of obstacles",
        imageId: "/images/deities/ganesha.jpg",
        sortOrder: 1,
        active: true,
      },
    ];

    const result = normalizeDeities(rawData);
    expect(result[0].name).toBe("Lord Ganesha");
    expect(result[0].subtitle).toBe("");
    expect(result[0].description).toBe("Remover of obstacles");
  });
});
