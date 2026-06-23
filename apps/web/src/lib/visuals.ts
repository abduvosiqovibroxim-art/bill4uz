// Детерминированные визуальные помощники: цвета/градиенты из строки и инициалы.
// Используются для аватаров тренеров (без фото) и градиентных обложек новостей.

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Инициалы из имени: до 2 букв (первые буквы первых двух слов). */
export function initialsFromName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) {
    return "?";
  }
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

/** Тёмный диагональный градиент, детерминированный по строке (в стиле сайта). */
export function gradientFromString(seed: string): string {
  const hash = hashString(seed || "billuz");
  const hue = hash % 360;
  const hue2 = (hue + 42) % 360;
  return `linear-gradient(135deg, hsl(${hue} 55% 26%) 0%, hsl(${hue2} 60% 16%) 100%)`;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  tournament: "linear-gradient(135deg, #0f4d35 0%, #08231a 100%)",
  platform: "linear-gradient(135deg, #1b3a5b 0%, #0a1726 100%)",
  product: "linear-gradient(135deg, #4a2b5e 0%, #1d1226 100%)",
  media: "linear-gradient(135deg, #5a3a18 0%, #241608 100%)"
};

/** Градиент обложки новости по категории (с запасным вариантом). */
export function categoryGradient(categoryKey: string): string {
  return CATEGORY_GRADIENTS[categoryKey] ?? gradientFromString(categoryKey);
}
