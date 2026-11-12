import type { H3Event } from "h3";
import type { R2Bucket } from "@cloudflare/workers-types";
import { ALLOWED_MIME_TYPES, MAX_MEDIA_SIZE_BYTES, type AllowedMimeType } from "../../shared/schemas/media";

export interface ImageInfo {
  mime: AllowedMimeType;
  width: number | null;
  height: number | null;
  extension: "jpg" | "png" | "webp";
}

/**
 * Validates file buffer magic bytes to ensure it is a valid JPEG, PNG, or WebP image.
 * Extracts image dimensions when possible.
 */
export function detectImageInfo(data: Uint8Array): ImageInfo | null {
  if (data.length < 12) return null;

  // 1. Check PNG (89 50 4E 47 0D 0A 1A 0A)
  if (
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47 &&
    data[4] === 0x0d &&
    data[5] === 0x0a &&
    data[6] === 0x1a &&
    data[7] === 0x0a
  ) {
    let width: number | null = null;
    let height: number | null = null;
    if (data.length >= 24) {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      width = view.getUint32(16, false); // Big endian
      height = view.getUint32(20, false);
    }
    return { mime: "image/png", width, height, extension: "png" };
  }

  // 2. Check JPEG (FF D8 FF)
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    let width: number | null = null;
    let height: number | null = null;

    // Scan for SOF markers (SOF0: 0xC0, SOF1: 0xC1, SOF2: 0xC2)
    let offset = 2;
    const len = data.length;
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    while (offset < len - 8) {
      if (data[offset] === 0xff) {
        const marker = data[offset + 1];
        if (marker === undefined) break;

        // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2)
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
          height = view.getUint16(offset + 5, false);
          width = view.getUint16(offset + 7, false);
          break;
        }
        // Marker with length
        if (
          marker >= 0xc0 &&
          marker <= 0xfe &&
          marker !== 0xd8 &&
          marker !== 0xd9 &&
          marker !== 0x00
        ) {
          const markerLen = view.getUint16(offset + 2, false);
          offset += 2 + markerLen;
        } else {
          offset += 1;
        }
      } else {
        offset += 1;
      }
    }

    return { mime: "image/jpeg", width, height, extension: "jpg" };
  }

  // 3. Check WebP (RIFF .... WEBP)
  if (
    data[0] === 0x52 &&
    data[1] === 0x49 &&
    data[2] === 0x46 &&
    data[3] === 0x46 &&
    data[8] === 0x57 &&
    data[9] === 0x45 &&
    data[10] === 0x42 &&
    data[11] === 0x50
  ) {
    let width: number | null = null;
    let height: number | null = null;

    const b12 = data[12] ?? 0;
    const b13 = data[13] ?? 0;
    const b14 = data[14] ?? 0;
    const b15 = data[15] ?? 0;
    const tag = String.fromCharCode(b12, b13, b14, b15);

    if (tag === "VP8 " && data.length >= 30) {
      // VP8 lossy
      const b0 = data[26] ?? 0;
      const b1 = data[27] ?? 0;
      const b2 = data[28] ?? 0;
      const b3 = data[29] ?? 0;
      width = (b0 | (b1 << 8)) & 0x3fff;
      height = (b2 | (b3 << 8)) & 0x3fff;
    } else if (tag === "VP8L" && data.length >= 25 && data[20] === 0x2f) {
      // VP8L lossless
      const b0 = data[21] ?? 0;
      const b1 = data[22] ?? 0;
      const b2 = data[23] ?? 0;
      const b3 = data[24] ?? 0;
      width = 1 + (b0 | ((b1 & 0x3f) << 8));
      height = 1 + ((b1 >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10));
    } else if (tag === "VP8X" && data.length >= 30) {
      // VP8X extended
      const w0 = data[24] ?? 0;
      const w1 = data[25] ?? 0;
      const w2 = data[26] ?? 0;
      width = 1 + (w0 | (w1 << 8) | (w2 << 16));
      const h0 = data[27] ?? 0;
      const h1 = data[28] ?? 0;
      const h2 = data[29] ?? 0;
      height = 1 + (h0 | (h1 << 8) | (h2 << 16));
    }

    return { mime: "image/webp", width, height, extension: "webp" };
  }

  return null;
}

/**
 * Generate a random non-guessable storage key for R2.
 */
export function generateMediaKey(extension: string): string {
  const timestamp = Date.now();
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `${timestamp}-${rand}.${extension}`;
}

/**
 * Retrieve the R2 bucket binding from event context.
 */
export function getMediaBucket(event: H3Event): R2Bucket {
  const env = event.context.cloudflare?.env as { MEDIA?: R2Bucket } | undefined;
  const mediaBinding = env?.MEDIA;

  if (!mediaBinding) {
    throw createError({
      statusCode: 503,
      statusMessage: "Cloudflare R2 Bucket binding 'MEDIA' is not available. Please enable R2 in Cloudflare Dashboard and attach the bucket in wrangler.jsonc.",
    });
  }

  return mediaBinding;
}
