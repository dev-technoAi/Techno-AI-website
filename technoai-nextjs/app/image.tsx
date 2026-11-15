import { getImageProps } from "next/image";
import type { ComponentProps } from "react";
import dimensions from "../content/image-dimensions.json";

const assets: Record<string, { width: number; height: number }> = dimensions;

/** Preserve intrinsic proportions while serving a viewport-sized, modern image format. */
export function SiteImage({ src, sizes = "(max-width: 900px) 100vw, 50vw", alt = "", ...props }: ComponentProps<"img"> & { src: string }) {
  const size = assets[src];
  if (!size) return <img src={src} alt={alt} {...props} />;
  const { props: imageProps } = getImageProps({ ...props, alt, src, width: size.width, height: size.height, sizes });
  return <img {...imageProps} />;
}

/** Video posters cannot use srcset; cap decorative posters at their rendered desktop size. */
export function videoPoster(src: string) {
  return /^\/redesign\/(hero-film|solutions\/(financial|robotics|satellite|industrial|security))\.jpg$/.test(src)
    ? src.replace("/redesign/", "/redesign/optimized/").replace(/\.jpg$/, ".webp") : src;
}
