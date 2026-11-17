import { getImageProps } from "next/image";
import type { ComponentProps } from "react";
import dimensions from "../content/image-dimensions.json";

const assets: Record<string, { width: number; height: number }> = dimensions;

/** Preserve intrinsic proportions while serving a viewport-sized, modern image format. */
export function SiteImage({ src, sizes = "(max-width: 900px) 100vw, 50vw", alt = "", ...props }: ComponentProps<"img"> & { src: string }) {
  // Article hero metadata retains absolute WordPress URLs. Reuse the identical local asset
  // when indexed so these heroes also get intrinsic sizing and responsive previews.
  const localSrc = src.replace(/^https?:\/\/(?:www\.)?technoai\.ae(?=\/)/i, "");
  const imageSrc = assets[localSrc] ? localSrc : src;
  const size = assets[imageSrc];
  if (!size) return <img src={src} sizes={sizes} alt={alt} {...props} />;
  const { props: imageProps } = getImageProps({ ...props, alt, src: imageSrc, width: size.width, height: size.height, sizes });
  return <img {...imageProps} />;
}

/** Video posters cannot use srcset; cap decorative posters at their rendered desktop size. */
export function videoPoster(src: string) {
  return /^\/redesign\/(hero-film|solutions\/(financial|robotics|satellite|industrial|security))\.jpg$/.test(src)
    ? src.replace("/redesign/", "/redesign/optimized/").replace(/\.jpg$/, ".webp") : src;
}
