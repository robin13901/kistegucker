'use client';

import Image from 'next/image';
import { useState } from 'react';

// Simple gray blur placeholder - works universally
const BLUR_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTRlNGU3Ii8+PC9zdmc+';

type OptimizedImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  sizes,
  priority = false
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative overflow-hidden">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        sizes={sizes}
        priority={priority}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        onLoad={() => setIsLoading(false)}
      />
      {isLoading && (
        <div
          className={`absolute inset-0 animate-pulse bg-zinc-200 ${className}`}
          style={{ aspectRatio: `${width}/${height}` }}
        />
      )}
    </div>
  );
}
