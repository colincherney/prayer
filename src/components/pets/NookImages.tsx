import { Image } from 'expo-image';
import React from 'react';
import { Image as NativeImage, type ImageStyle, type StyleProp } from 'react-native';

const NOOK_IMAGES = {
  candles: {
    source: require('@/assets/images/customization-icons/optimized/candle.png'),
    thumbnail: require('@/assets/images/customization-icons/optimized/candle-thumb.png'),
  },
  bluerug: {
    source: require('@/assets/images/customization-icons/optimized/blue-carpet.png'),
    thumbnail: require('@/assets/images/customization-icons/optimized/blue-carpet-thumb.png'),
  },
  rug: {
    source: require('@/assets/images/customization-icons/optimized/red-carpet.png'),
    thumbnail: require('@/assets/images/customization-icons/optimized/red-carpet-thumb.png'),
  },
  lily: {
    source: require('@/assets/images/customization-icons/optimized/potted-flower.png'),
    thumbnail: require('@/assets/images/customization-icons/optimized/potted-flower-thumb.png'),
  },
} as const;

type NookImageId = keyof typeof NOOK_IMAGES;

export function hasNookImage(id: string): id is NookImageId {
  return Object.prototype.hasOwnProperty.call(NOOK_IMAGES, id);
}

/** Warm the small local assets before the decorator needs them; this never blocks opening it. */
export function prefetchNookImages() {
  const urls = Object.values(NOOK_IMAGES)
    .flatMap(art => [art.source, art.thumbnail])
    .map(source => NativeImage.resolveAssetSource(source)?.uri)
    .filter((uri): uri is string => !!uri);
  return Image.prefetch(urls, 'memory-disk');
}

/** Bitmap decorations use the native image cache rather than being decoded inside SVG layers. */
export function NookImage({ id, thumbnail = false, style }: {
  id: NookImageId;
  thumbnail?: boolean;
  style: StyleProp<ImageStyle>;
}) {
  const artwork = NOOK_IMAGES[id];
  return (
    <Image
      source={thumbnail ? artwork.thumbnail : artwork.source}
      style={style}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={0}
      loading="eager"
      pointerEvents="none"
    />
  );
}
