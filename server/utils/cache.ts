/**
 * Cache management and invalidation utility for Nitro and Cloudflare Workers.
 */
export async function purgeCache(tags: string[] = []): Promise<{ purged: string[]; count: number }> {
  const purged: string[] = [];

  try {
    // In Nitro, cached handlers are stored in the 'cache' storage namespace
    if (typeof useStorage !== "undefined") {
      const storage = useStorage("cache");
      const keys = await storage.getKeys();

      if (tags.length === 0) {
        // Purge all handler caches
        for (const key of keys) {
          await storage.removeItem(key);
          purged.push(key);
        }
      } else {
        // Purge handler caches matching specified tags/prefixes
        for (const key of keys) {
          const matches = tags.some((tag) => key.toLowerCase().includes(tag.toLowerCase()));
          if (matches) {
            await storage.removeItem(key);
            purged.push(key);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Cache purge notification (non-fatal):", err);
  }

  return {
    purged,
    count: purged.length,
  };
}
