import sharp, { type Sharp } from "sharp";

/**
 * Instagram aspect ratio constraints by content type.
 * Feed posts: 0.75:1 (4:5) to 1.91:1 (landscape)
 * Stories/Reels: 9:16 (0.5625:1)
 */
const INSTAGRAM_FEED_TARGET = { width: 1080, height: 1350 }; // 4:5
const INSTAGRAM_STORY_TARGET = { width: 1080, height: 1920 }; // 9:16

export type ContentType = "feed" | "story";

interface CropResult {
  buffer: Buffer;
  contentType: string;
}

/**
 * Auto-crop/resize an image buffer to fit Instagram's aspect ratio.
 * - feed: crops to 4:5 (1080×1350)
 * - story: crops to 9:16 (1080×1920)
 *
 * Returns the processed buffer and the MIME type.
 */
export async function autoCropForInstagram(
  input: Buffer,
  mimeType: string,
  type: ContentType = "feed"
): Promise<CropResult> {
  const target = type === "story" ? INSTAGRAM_STORY_TARGET : INSTAGRAM_FEED_TARGET;
  const targetRatio = target.width / target.height;

  const image = sharp(input);
  const meta = await image.metadata();
  const srcWidth = meta.width ?? target.width;
  const srcHeight = meta.height ?? target.height;
  const srcRatio = srcWidth / srcHeight;

  let pipeline: Sharp;

  if (Math.abs(srcRatio - targetRatio) < 0.01) {
    // Already the right ratio — just resize
    pipeline = image.resize(target.width, target.height, { fit: "cover" });
  } else if (srcRatio > targetRatio) {
    // Source is wider — crop sides (center crop)
    const cropWidth = Math.round(srcHeight * targetRatio);
    pipeline = image
      .resize(cropWidth, srcHeight, { fit: "cover" })
      .resize(target.width, target.height, { fit: "cover" });
  } else {
    // Source is taller — crop top/bottom (center crop)
    const cropHeight = Math.round(srcWidth / targetRatio);
    pipeline = image
      .resize(srcWidth, cropHeight, { fit: "cover" })
      .resize(target.width, target.height, { fit: "cover" });
  }

  // Output as JPEG for maximum compatibility, or keep PNG for transparency
  const outputFormat = mimeType === "image/png" ? "png" : "jpeg";
  const outputMime = outputFormat === "png" ? "image/png" : "image/jpeg";

  const buffer = await pipeline
    .toFormat(outputFormat, { quality: 90 })
    .toBuffer();

  return { buffer, contentType: outputMime };
}

/**
 * Check if an image needs cropping for Instagram feed.
 * Returns true if the aspect ratio is outside 0.75–1.91.
 */
export function needsInstagramCrop(
  width: number,
  height: number,
  type: ContentType = "feed"
): boolean {
  const ratio = width / height;
  if (type === "story") {
    const storyRatio = 9 / 16;
    return Math.abs(ratio - storyRatio) > 0.05;
  }
  return ratio < 0.75 || ratio > 1.91;
}
