import dimensions from "../content/image-dimensions.json";

const assets: Record<string, { width: number; height: number }> = dimensions;

/** Use an existing original rather than enlarging a WordPress thumbnail. */
export function originalImageSource(src: string) {
  const local = src.replace(/^https?:\/\/(?:www\.)?technoai\.ae(?=\/)/i, "");
  const original = local.replace(/-\d+x\d+(?=\.[^.]+$)/, "");
  const current = assets[local];
  const full = assets[original];
  if (current && full && full.width > current.width && full.height > current.height) return original;
  return assets[local] ? local : src;
}
