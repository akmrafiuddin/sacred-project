import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { homeCms } from "../../db/schema/content";
import { defaultHomeData } from "../../cms/defaults";

export default defineEventHandler(async (event) => {
  const db = getDb(event);

  try {
    const rows = await db
      .select()
      .from(homeCms)
      .where(eq(homeCms.key, "homepage"))
      .limit(1);

    const record = rows[0];
    const data = record?.data ? JSON.parse(record.data) : defaultHomeData;

    return {
      name: "Golpahar Mohashoshan Kali Mandir",
      location: "Chittagong, Bangladesh",
      contact: {
        phone: "+880 1819-000000",
        email: "contact@golpaharkalimandir.org",
        address: "Golpahar, GEC Circle, Chattogram, Bangladesh",
      },
      hero: data.hero,
      donation: data.donation,
      updatedAt: record?.updatedAt || new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: "Golpahar Mohashoshan Kali Mandir",
      location: "Chittagong, Bangladesh",
      contact: {
        phone: "+880 1819-000000",
        email: "contact@golpaharkalimandir.org",
        address: "Golpahar, GEC Circle, Chattogram, Bangladesh",
      },
      hero: defaultHomeData.hero,
      donation: defaultHomeData.donation,
      updatedAt: new Date().toISOString(),
    };
  }
});
