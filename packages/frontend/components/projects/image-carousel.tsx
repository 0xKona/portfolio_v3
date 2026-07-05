"use client";

import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { getProjectImageUrl } from "@/lib/api";

interface ImageCarouselProps {
  projectId: string;
  images: string[];
  projectName: string;
}

export function ImageCarousel({
  projectId,
  images: imageIds,
  projectName,
}: ImageCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [mainRef, mainApi] = useEmblaCarousel({ loop: true });
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });

  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainApi) return;
      mainApi.scrollTo(index);
    },
    [mainApi],
  );

  const onSelect = useCallback(() => {
    if (!mainApi || !thumbApi) return;
    const index = mainApi.selectedScrollSnap();
    setSelectedIndex(index);
    thumbApi.scrollTo(index);
  }, [mainApi, thumbApi]);

  useEffect(() => {
    if (!mainApi) return;
    onSelect();
    mainApi.on("select", onSelect);
    mainApi.on("reInit", onSelect);
    return () => {
      mainApi.off("select", onSelect);
      mainApi.off("reInit", onSelect);
    };
  }, [mainApi, onSelect]);

  const images = imageIds.map((imageId, i) => ({
    src: getProjectImageUrl(projectId, "optimised", imageId),
    thumbSrc: getProjectImageUrl(projectId, "thumbnail", imageId),
    alt: `${projectName} screenshot ${i + 1}`,
  }));

  if (images.length === 0) {
    return (
      <div className="border border-neutral-800 p-8 text-center">
        <p className="text-neutral-600 text-xs font-mono">
          no images available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Main viewport */}
      <div className="border border-neutral-700 overflow-hidden" ref={mainRef}>
        <div className="flex">
          {images.map((img, i) => (
            <div key={i} className="flex-[0_0_100%] min-w-0">
              <div className="relative aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback =
                      e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div
                  className="absolute inset-0 bg-neutral-800 items-center justify-center font-mono text-neutral-600 text-xs hidden"
                >
                  <pre className="select-none text-center leading-tight">
{`┌─────────────┐
│  ░░░░░░░░░  │
│  ░ IMAGE ░  │
│  ░░░░░░░░░  │
└─────────────┘`}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="overflow-hidden" ref={thumbRef}>
          <div className="flex gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onThumbClick(i)}
                aria-label={`View image ${i + 1}`}
                className={`flex-[0_0_80px] min-w-0 aspect-video border transition-colors cursor-pointer ${
                  i === selectedIndex
                    ? "border-cyan-400"
                    : "border-neutral-700 hover:border-neutral-500"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.thumbSrc}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
