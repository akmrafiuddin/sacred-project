import { defineEventHandler, createError, readMultipartFormData } from "h3";
import { getDb } from "../../db";
import { requireRole } from "../../utils/session";
import { detectImageInfo, generateMediaKey, getMediaBucket } from "../../utils/media";
import { MediaService } from "../../services/media";
import { MAX_MEDIA_SIZE_BYTES } from "../../../shared/schemas/media";
import type { Localized } from "../../../shared/schemas/common";

export default defineEventHandler(async (event) => {
  // 1. Authorize admin or editor
  const session = await requireRole(event, ["admin", "editor"]);
  const db = getDb(event);
  const bucket = getMediaBucket(event);

  // 2. Read multipart form data
  const formData = await readMultipartFormData(event);
  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No file uploaded. Expected multipart form data.",
    });
  }

  // Find file item
  const fileItem = formData.find((item) => item.name === "file" || item.filename);
  if (!fileItem || !fileItem.data || fileItem.data.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing file payload in request",
    });
  }

  // Check file size
  if (fileItem.data.length > MAX_MEDIA_SIZE_BYTES) {
    throw createError({
      statusCode: 400,
      statusMessage: `File exceeds maximum allowed size of 5 MB (${(fileItem.data.length / (1024 * 1024)).toFixed(2)} MB)`,
    });
  }

  // Validate magic bytes
  const imageInfo = detectImageInfo(fileItem.data);
  if (!imageInfo) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid image file. Only JPEG, PNG, and WebP images are allowed.",
    });
  }

  // Parse alt text if provided
  let alt: Localized = {
    en: fileItem.filename ? fileItem.filename.replace(/\.[^/.]+$/, "") : "Mandir Image",
    bn: "",
  };

  const altItem = formData.find((item) => item.name === "alt");
  if (altItem && altItem.data) {
    try {
      const parsed = JSON.parse(altItem.data.toString("utf-8"));
      if (typeof parsed === "object" && parsed !== null && "en" in parsed) {
        alt = {
          en: String(parsed.en || "").trim() || alt.en,
          bn: String(parsed.bn || "").trim(),
        };
      }
    } catch {
      // Plain string fallback
      const text = altItem.data.toString("utf-8").trim();
      if (text) {
        alt = { en: text, bn: "" };
      }
    }
  }

  // 3. Generate random immutable key and upload to R2
  const key = generateMediaKey(imageInfo.extension);

  await bucket.put(key, fileItem.data, {
    httpMetadata: {
      contentType: imageInfo.mime,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  // 4. Save record to DB
  const record = await MediaService.createMedia(db, {
    key,
    mime: imageInfo.mime,
    size: fileItem.data.length,
    width: imageInfo.width,
    height: imageInfo.height,
    alt,
    uploadedBy: session.user.id,
  });

  return {
    success: true,
    media: record,
    url: `/api/media/${record.key}`,
  };
});
