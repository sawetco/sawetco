"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type ProjectImageProps = {
  src: string;
  alt: string;
  sizes: string;
};

export function ProjectImage({ src, alt, sizes }: ProjectImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold: 0.01 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-muted"
    >
      {shouldLoad ? (
        <Image
          className="object-cover opacity-0 transition-opacity duration-700 data-[loaded]:opacity-100 motion-reduce:opacity-100 motion-reduce:transition-none"
          src={src}
          alt={alt}
          fill
          loading="lazy"
          quality={100}
          sizes={sizes}
          data-loaded={isLoaded ? "" : undefined}
          onLoad={() => setIsLoaded(true)}
        />
      ) : null}
    </div>
  );
}
