import { describe, it, expect } from "bun:test";

describe("Puja, Festivals, and Notices Pages Data Mapping", () => {
  describe("Puja & Rituals Page Logic", () => {
    it("formats 24-hour time string into readable 12-hour format with AM/PM", () => {
      const formatTime12h = (time24: string) => {
        if (!time24) return "";
        const [hStr, mStr] = time24.split(":");
        const h = parseInt(hStr || "0", 10);
        const m = mStr || "00";
        const ampm = h >= 12 ? "PM" : "AM";
        const displayH = h % 12 || 12;
        return `${displayH}:${m} ${ampm}`;
      };

      expect(formatTime12h("05:00")).toBe("5:00 AM");
      expect(formatTime12h("07:30")).toBe("7:30 AM");
      expect(formatTime12h("12:30")).toBe("12:30 PM");
      expect(formatTime12h("18:30")).toBe("6:30 PM");
      expect(formatTime12h("21:30")).toBe("9:30 PM");
    });

    it("filters out inactive pujas and normalizes pricing and localization", () => {
      const rawPujas = [
        {
          id: 1,
          slug: "nitya-puja",
          name: { en: "Nitya Puja", bn: "নিত্য পূজা" },
          description: { en: "Daily worship", bn: "" },
          offered: { en: "Flowers & Prasad", bn: "" },
          priceBdt: 501,
          duration: "45 minutes",
          active: true,
          sortOrder: 1,
        },
        {
          id: 2,
          slug: "hidden-puja",
          name: { en: "Inactive Offering", bn: "" },
          description: { en: "Draft only", bn: "" },
          priceBdt: 999,
          active: false,
          sortOrder: 2,
        },
      ];

      const displayed = rawPujas
        .filter((p) => p.active !== false)
        .map((p) => ({
          name: typeof p.name === "object" ? p.name.en : p.name,
          priceBdt: p.priceBdt,
        }));

      expect(displayed.length).toBe(1);
      expect(displayed[0].name).toBe("Nitya Puja");
      expect(displayed[0].priceBdt).toBe(501);
    });
  });

  describe("Festivals & Events Page Logic", () => {
    it("parses calendar date strings into month and day badges", () => {
      const parseDateBadge = (dateStr: string) => {
        if (!dateStr) return { month: "CAL", day: "--" };
        const parts = dateStr.split("-");
        if (parts.length < 3) return { month: "CAL", day: "--" };
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
        const day = String(parts[2]).padStart(2, "0");
        return { month, day };
      };

      expect(parseDateBadge("2026-11-24")).toEqual({ month: "NOV", day: "24" });
      expect(parseDateBadge("2026-03-08")).toEqual({ month: "MAR", day: "08" });
    });

    it("filters events by kind correctly", () => {
      const rawEvents = [
        { id: 1, kind: "festival", title: "Maha Shivaratri", active: true },
        { id: 2, kind: "special_puja", title: "Go-Puja", active: true },
        { id: 3, kind: "festival", title: "Dol Purnima", active: true },
        { id: 4, kind: "seva", title: "Winter Drive", active: false },
      ];

      const activeEvents = rawEvents.filter((e) => e.active);
      const festivalsOnly = activeEvents.filter((e) => e.kind === "festival");
      const specialPujasOnly = activeEvents.filter((e) => e.kind === "special_puja");

      expect(festivalsOnly.length).toBe(2);
      expect(specialPujasOnly.length).toBe(1);
      expect(festivalsOnly[0].title).toBe("Maha Shivaratri");
      expect(festivalsOnly[1].title).toBe("Dol Purnima");
    });
  });

  describe("Temple Notices Page Logic", () => {
    it("prioritizes pinned notices and sorts by date descending", () => {
      const rawNotices = [
        { id: 1, title: "Notice A", date: "2026-11-10", pinned: false, active: true },
        { id: 2, title: "Pinned Notice B", date: "2026-11-05", pinned: true, active: true },
        { id: 3, title: "Notice C", date: "2026-11-12", pinned: false, active: true },
      ];

      const sorted = [...rawNotices].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.date.localeCompare(a.date);
      });

      expect(sorted[0].title).toBe("Pinned Notice B");
      expect(sorted[1].title).toBe("Notice C");
      expect(sorted[2].title).toBe("Notice A");
    });

    it("filters notices by category", () => {
      const rawNotices = [
        { id: 1, category: "schedule", title: "Schedule Update", active: true },
        { id: 2, category: "seva", title: "Volunteer Openings", active: true },
        { id: 3, category: "welfare", title: "Blanket Drive", active: true },
      ];

      const scheduleNotices = rawNotices.filter((n) => n.category === "schedule");
      expect(scheduleNotices.length).toBe(1);
      expect(scheduleNotices[0].title).toBe("Schedule Update");
    });
  });
});
