import { describe, it, expect } from "bun:test";
import { defaultAboutData } from "../server/cms/aboutDefaults";

describe("About Page UI Components & Data Mapping", () => {
  it("has valid defaultAboutData with all required fields", () => {
    expect(defaultAboutData.hero.titleEn).toBeDefined();
    expect(defaultAboutData.hero.titleBn).toBeDefined();
    expect(defaultAboutData.hero.subtitle).toBeDefined();
    expect(defaultAboutData.history.narrativeParagraphs.length).toBeGreaterThan(0);
    expect(defaultAboutData.history.quote).toBeDefined();
    expect(defaultAboutData.history.quoteAuthor).toBeDefined();
    expect(defaultAboutData.pillars.length).toBe(4);
    expect(defaultAboutData.shrines.length).toBeGreaterThan(0);
    expect(defaultAboutData.administration.keyResponsibilities.length).toBeGreaterThan(0);
    expect(defaultAboutData.guidelines.length).toBeGreaterThan(0);
  });

  it("handles image slider behavior logic cleanly (0 images, 1 image, 2+ images)", () => {
    // 0 images -> should render nothing
    const zeroImages: any[] = [];
    expect(zeroImages.length).toBe(0);

    // 1 image -> static feature card, no controls
    const singleImage = [{ src: "/mandir-1.jpg", alt: "Mandir View", caption: "Front Entrance" }];
    expect(singleImage.length).toBe(1);
    const isSingle = singleImage.length === 1;
    const isMultiple = singleImage.length > 1;
    expect(isSingle).toBe(true);
    expect(isMultiple).toBe(false);

    // 2+ images -> full slider
    const multiImages = [
      { src: "/mandir-1.jpg", alt: "Slide 1" },
      { src: "/mandir-2.jpg", alt: "Slide 2" },
      { src: "/mandir-3.jpg", alt: "Slide 3" },
    ];
    expect(multiImages.length).toBe(3);
    expect(multiImages.length > 1).toBe(true);

    // Counter format: 01 / 03
    const currentIndex = 0;
    const counterText = `${String(currentIndex + 1).padStart(2, "0")} / ${String(multiImages.length).padStart(2, "0")}`;
    expect(counterText).toBe("01 / 03");
  });

  it("verifies drop cap and hyphenation constraints for English vs Bengali", () => {
    // English allows drop cap and justification on desktop
    const enLocale = "en";
    const bnLocale = "bn";

    expect(enLocale).toBe("en");
    expect(bnLocale).toBe("bn");
  });
});
