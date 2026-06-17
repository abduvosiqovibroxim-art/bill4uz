"use client";

import { useState } from "react";
import { ClubImage } from "@/lib/types";

interface ClubGalleryProps {
  images: ClubImage[];
  clubName: string;
}

export function ClubGallery({ images, clubName }: ClubGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const goToPrevious = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === 0 ? images.length - 1 : lightboxIndex - 1);
  };

  const goToNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === images.length - 1 ? 0 : lightboxIndex + 1);
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            className="relative aspect-square rounded-lg overflow-hidden transition-all hover:scale-105 cursor-pointer"
            style={{ border: "1px solid var(--card-border)" }}
            onClick={() => openLightbox(index)}
          >
            <img
              src={image.url}
              alt={`${clubName} - фото ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {index === 0 && (
              <div className="absolute top-2 left-2 px-2 py-1 text-xs font-bold uppercase rounded" style={{ background: "var(--emerald)", color: "var(--bg)" }}>
                Главное
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(10, 15, 20, 0.95)" }}
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full text-2xl font-bold transition-all hover:scale-110"
            style={{ background: "var(--surface)", color: "var(--text)" }}
            onClick={closeLightbox}
          >
            ×
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--surface)", color: "var(--text)" }}>
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Previous button */}
          {images.length > 1 && (
            <button
              type="button"
              className="absolute left-4 w-12 h-12 flex items-center justify-center rounded-full text-3xl font-bold transition-all hover:scale-110"
              style={{ background: "var(--surface)", color: "var(--text)" }}
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              ‹
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-5xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex].url}
              alt={`${clubName} - фото ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
            />
          </div>

          {/* Next button */}
          {images.length > 1 && (
            <button
              type="button"
              className="absolute right-4 w-12 h-12 flex items-center justify-center rounded-full text-3xl font-bold transition-all hover:scale-110"
              style={{ background: "var(--surface)", color: "var(--text)" }}
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              ›
            </button>
          )}

          {/* Keyboard navigation hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-xs" style={{ background: "var(--surface)", color: "var(--muted)" }}>
            Используйте ← → для навигации, ESC для закрытия
          </div>
        </div>
      )}
    </>
  );
}
