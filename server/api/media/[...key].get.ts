import { defineEventHandler, createError, getRequestHeader, setResponseHeaders, setResponseStatus, sendStream } from "h3";
import { getMediaBucket } from "../../utils/media";

export default defineEventHandler(async (event) => {
  const key = event.context.params?.key;
  if (!key) {
    throw createError({
      statusCode: 404,
      statusMessage: "Media key is required",
    });
  }

  const bucket = getMediaBucket(event);
  const object = await bucket.get(key);

  if (!object) {
    throw createError({
      statusCode: 404,
      statusMessage: "Media file not found",
    });
  }

  const etag = object.httpEtag;
  const ifNoneMatch = getRequestHeader(event, "if-none-match");

  if (ifNoneMatch && etag && (ifNoneMatch === etag || ifNoneMatch === `W/${etag}`)) {
    setResponseStatus(event, 304);
    return null;
  }

  const headers: Record<string, string> = {
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
  };

  if (etag) {
    headers["ETag"] = etag;
  }

  if (object.size !== undefined) {
    headers["Content-Length"] = String(object.size);
  }

  setResponseHeaders(event, headers);

  return sendStream(event, object.body as any);
});
