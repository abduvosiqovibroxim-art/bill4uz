"use client";

interface ClubCoverImageProps {
  coverImageUrl: string | null;
  clubName: string;
  rating?: number | null;
  reviewsCount?: number;
  isVerified?: boolean;
}

export function ClubCoverImage({ coverImageUrl, clubName, rating, reviewsCount, isVerified }: ClubCoverImageProps) {
  const fallbackImage = "/images/billiard-table-placeholder.jpg";

  return (
    <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden" style={{ border: "1px solid var(--card-border)" }}>
      <img
        src={coverImageUrl || fallbackImage}
        alt={clubName}
        className="w-full h-full object-cover"
      />

      {/* Overlay with info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Info badges */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        <div className="flex flex-col gap-2">
          {rating && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(26, 31, 36, 0.8)", backdropFilter: "blur(8px)" }}>
              <span className="text-2xl">⭐</span>
              <div>
                <div className="text-xl font-bold" style={{ color: "var(--accent)" }}>{rating.toFixed(1)}</div>
                {reviewsCount && reviewsCount > 0 ? (
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{reviewsCount} отзывов</div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {isVerified && (
          <div className="px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: "var(--emerald)", color: "var(--bg)" }}>
            <span className="text-sm font-bold">✓</span>
            <span className="text-sm font-semibold">Проверено</span>
          </div>
        )}
      </div>
    </div>
  );
}
