import { getImageProps } from "next/image";
import type { ComponentProps } from "react";
import dimensions from "../content/image-dimensions.json";
import { originalImageSource } from "./media-source";

const assets: Record<string, { width: number; height: number }> = dimensions;

/** Preserve intrinsic proportions while serving a viewport-sized, modern image format. */
export function SiteImage({ src, sizes = "(max-width: 900px) 100vw, 50vw", alt = "", ...props }: ComponentProps<"img"> & { src: string }) {
  // Article hero metadata retains absolute WordPress URLs. Reuse the identical local asset
  // when indexed so these heroes also get intrinsic sizing and responsive previews.
  const imageSrc = originalImageSource(src);
  const size = assets[imageSrc];
  if (!size) return <img src={src} sizes={sizes} alt={alt} {...props} />;
  const { props: imageProps } = getImageProps({ ...props, alt, src: imageSrc, width: size.width, height: size.height, sizes, quality: 90 });
  return <img {...imageProps} />;
}

/** Video posters cannot use srcset; retain the full-resolution source for large screens. */
export function videoPoster(src: string) {
  return src;
}
