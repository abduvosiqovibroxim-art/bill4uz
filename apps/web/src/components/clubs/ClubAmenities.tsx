"use client";

interface ClubAmenitiesProps {
  amenities: string[];
}

const AMENITY_ICONS: Record<string, string> = {
  wifi: "📶",
  parking: "🅿️",
  bar: "🍺",
  restaurant: "🍽️",
  cafe: "☕",
  smoking: "🚬",
  "no-smoking": "🚭",
  ac: "❄️",
  terrace: "🌳",
  hookah: "💨",
  tv: "📺",
  music: "🎵",
};

const AMENITY_LABELS: Record<string, Record<string, string>> = {
  wifi: { ru: "Wi-Fi", uz: "Wi-Fi", en: "Wi-Fi" },
  parking: { ru: "Парковка", uz: "To'xtash joyi", en: "Parking" },
  bar: { ru: "Бар", uz: "Bar", en: "Bar" },
  restaurant: { ru: "Ресторан", uz: "Restoran", en: "Restaurant" },
  cafe: { ru: "Кафе", uz: "Kafe", en: "Cafe" },
  smoking: { ru: "Курение", uz: "Chekish", en: "Smoking" },
  "no-smoking": { ru: "Не курить", uz: "Chekish taqiqlangan", en: "No smoking" },
  ac: { ru: "Кондиционер", uz: "Konditsioner", en: "AC" },
  terrace: { ru: "Терраса", uz: "Terassa", en: "Terrace" },
  hookah: { ru: "Кальян", uz: "Qalyan", en: "Hookah" },
  tv: { ru: "ТВ", uz: "TV", en: "TV" },
  music: { ru: "Музыка", uz: "Musiqa", en: "Music" },
};

export function ClubAmenities({ amenities }: ClubAmenitiesProps) {
  if (!amenities || amenities.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>
        Удобства
      </h3>
      <div className="flex flex-wrap gap-3">
        {amenities.map((amenity) => {
          const icon = AMENITY_ICONS[amenity] || "•";
          const label = AMENITY_LABELS[amenity]?.ru || amenity;

          return (
            <div
              key={amenity}
              className="px-4 py-3 rounded-lg flex items-center gap-2.5 transition-all hover:scale-105"
              style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)" }}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
