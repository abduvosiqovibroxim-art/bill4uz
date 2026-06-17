/**
 * Парсер 2GIS для поиска бильярдных клубов
 *
 * Использует Puppeteer для веб-скрапинга 2GIS
 */

import * as puppeteer from 'puppeteer';

export interface Club2GISData {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  phone?: string;
  workingHours?: string;
  rating?: number;
  reviewsCount?: number;
  photos?: string[];
  description?: string;
  website?: string;
}

/**
 * Парсинг клубов из 2GIS по городу и запросу
 */
export async function parse2GISClubs(
  city: string,
  query: string = 'бильярд'
): Promise<Club2GISData[]> {
  console.log(`🔍 Парсинг 2GIS: ${city}, запрос "${query}"`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const clubs: Club2GISData[] = [];

  try {
    // Переход на 2GIS
    const searchUrl = `https://2gis.ru/${city}/search/${encodeURIComponent(query)}`;
    console.log(`  📡 URL: ${searchUrl}`);

    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Подождать загрузки результатов
    await page.waitForSelector('[data-testid="search-result-item"]', { timeout: 10000 });

    // Извлечь список клубов
    const items = await page.$$('[data-testid="search-result-item"]');
    console.log(`  📋 Найдено результатов: ${items.length}`);

    for (let i = 0; i < Math.min(items.length, 20); i++) {
      try {
        const item = items[i];

        // Кликнуть на карточку, чтобы открыть детали
        await item.click();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Извлечь данные
        const club = await page.evaluate(() => {
          const getName = () => {
            const el = document.querySelector('[data-testid="object-name"]');
            return el?.textContent?.trim() || '';
          };

          const getAddress = () => {
            const el = document.querySelector('[data-testid="object-address"]');
            return el?.textContent?.trim() || '';
          };

          const getPhone = () => {
            const el = document.querySelector('[data-testid="object-phone"]');
            return el?.textContent?.trim() || undefined;
          };

          const getWorkingHours = () => {
            const el = document.querySelector('[data-testid="working-hours"]');
            return el?.textContent?.trim() || undefined;
          };

          const getRating = () => {
            const el = document.querySelector('[data-testid="rating-value"]');
            const text = el?.textContent?.trim();
            return text ? parseFloat(text) : undefined;
          };

          const getReviewsCount = () => {
            const el = document.querySelector('[data-testid="reviews-count"]');
            const text = el?.textContent?.trim();
            const match = text?.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
          };

          const getPhotos = () => {
            const images = Array.from(document.querySelectorAll('[data-testid="photo-gallery"] img'));
            return images.map(img => (img as HTMLImageElement).src).filter(src => src && !src.includes('placeholder'));
          };

          const getDescription = () => {
            const el = document.querySelector('[data-testid="description"]');
            return el?.textContent?.trim() || undefined;
          };

          return {
            name: getName(),
            address: getAddress(),
            phone: getPhone(),
            workingHours: getWorkingHours(),
            rating: getRating(),
            reviewsCount: getReviewsCount(),
            photos: getPhotos(),
            description: getDescription(),
          };
        });

        // Получить координаты из URL
        const url = page.url();
        const coordsMatch = url.match(/(\d+\.\d+),(\d+\.\d+)/);
        const lat = coordsMatch ? parseFloat(coordsMatch[1]) : 0;
        const lon = coordsMatch ? parseFloat(coordsMatch[2]) : 0;

        // Сгенерировать ID из URL
        const idMatch = url.match(/firm\/(\w+)/);
        const id = idMatch ? idMatch[1] : `2gis-${Date.now()}-${i}`;

        if (club.name && club.address) {
          clubs.push({
            id,
            lat,
            lon,
            ...club,
          });

          console.log(`  ✅ Добавлен: ${club.name}`);
        }

        // Вернуться к списку
        await page.goBack();
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`  ❌ Ошибка при парсинге элемента ${i}:`, error);
        continue;
      }
    }

  } catch (error) {
    console.error('❌ Ошибка при парсинге 2GIS:', error);
  } finally {
    await browser.close();
  }

  console.log(`  ✨ Парсинг завершен, найдено клубов: ${clubs.length}\n`);
  return clubs;
}

/**
 * Альтернативный метод: использование публичного API 2GIS (требует ключ)
 */
export async function fetch2GISClubsAPI(
  query: string,
  lat: number,
  lon: number,
  apiKey: string
): Promise<Club2GISData[]> {
  const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&point=${lon},${lat}&radius=50000&key=${apiKey}&fields=items.contact_groups,items.reviews`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.result?.items) {
      return [];
    }

    return data.result.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      address: item.address_name || '',
      lat: item.point?.lat || 0,
      lon: item.point?.lon || 0,
      phone: item.contact_groups?.[0]?.contacts?.find((c: any) => c.type === 'phone')?.text,
      workingHours: item.schedule_comment,
      rating: item.reviews?.rating,
      reviewsCount: item.reviews?.count || 0,
      photos: item.photos?.map((p: any) => p.url) || [],
      description: item.description,
      website: item.contact_groups?.[0]?.contacts?.find((c: any) => c.type === 'website')?.text,
    }));

  } catch (error) {
    console.error('Ошибка при запросе к 2GIS API:', error);
    return [];
  }
}
