import { z } from "zod";
import { localized, pagination } from "./common";

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
export const MAX_MEDIA_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const updateMediaSchema = z.object({
  id: z.number().int().positive(),
  alt: localized,
});

export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;

export const mediaQuerySchema = pagination.extend({
  mime: z.enum(ALLOWED_MIME_TYPES).optional(),
});

export type MediaQueryInput = z.infer<typeof mediaQuerySchema>;
