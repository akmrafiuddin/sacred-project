import { describe, it, expect } from "bun:test";
import { sitemapCategories, type SitemapCategory } from "../shared/constants/sitemap";

describe("Frontend Sitemap Directory", () => {
  it("defines structured categories with valid non-empty metadata", () => {
    expect(sitemapCategories.length).toBeGreaterThanOrEqual(4);

    for (const cat of sitemapCategories) {
      expect(cat.id).toBeTruthy();
      expect(cat.title.length).toBeGreaterThan(0);
      expect(cat.description.length).toBeGreaterThan(0);
      expect(cat.links.length).toBeGreaterThan(0);
    }
  });

  it("ensures every sitemap link has a title, valid path starting with '/', and a description", () => {
    const allLinks = sitemapCategories.flatMap((c) => c.links);
    expect(allLinks.length).toBeGreaterThan(10);

    for (const link of allLinks) {
      expect(link.title).toBeTruthy();
      expect(link.path.startsWith("/")).toBe(true);
      expect(link.description).toBeTruthy();
      expect(link.description.length).toBeGreaterThan(10);
    }
  });

  it("includes all essential public pages, services, and portals", () => {
    const allPaths = sitemapCategories.flatMap((c) => c.links.map((l) => l.path));

    const requiredPublicPaths = [
      "/",
      "/about",
      "/deities",
      "/history",
      "/gallery",
      "/puja-and-rituals",
      "/puja-booking",
      "/booking-status",
      "/festivals-and-events",
      "/notice-news",
      "/contact",
      "/account",
      "/admin/login",
    ];

    for (const requiredPath of requiredPublicPaths) {
      expect(allPaths).toContain(requiredPath);
    }
  });

  it("has unique paths across all categories without unwanted duplicates", () => {
    const allPaths = sitemapCategories.flatMap((c) => c.links.map((l) => l.path));
    const uniquePaths = new Set(allPaths);
    expect(uniquePaths.size).toBe(allPaths.length);
  });

  it("handles case-insensitive search and filter logic reliably", () => {
    const query = "puja";
    const matchedCategories = sitemapCategories
      .map((cat) => {
        const matchesCategory =
          cat.title.toLowerCase().includes(query) ||
          cat.description.toLowerCase().includes(query);

        const matchedLinks = cat.links.filter(
          (link) =>
            matchesCategory ||
            link.title.toLowerCase().includes(query) ||
            link.path.toLowerCase().includes(query) ||
            link.description.toLowerCase().includes(query)
        );

        if (matchedLinks.length === 0) return null;
        return { ...cat, links: matchedLinks };
      })
      .filter((c): c is SitemapCategory => c !== null);

    expect(matchedCategories.length).toBeGreaterThan(0);
    const matchedLinkPaths = matchedCategories.flatMap((c) => c.links.map((l) => l.path));
    expect(matchedLinkPaths).toContain("/puja-and-rituals");
    expect(matchedLinkPaths).toContain("/puja-booking");
  });
});
