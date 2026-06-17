/**
 * Скрипт для парсинга бильярдных клубов Узбекистана из 2GIS
 *
 * Использование:
 * npx tsx scripts/seed-clubs-uzbekistan.ts
 *
 * С API ключом (рекомендуется):
 * TWOGIS_API_KEY=your_key npx tsx scripts/seed-clubs-uzbekistan.ts
 *
 * С веб-скрапингом (медленнее):
 * USE_SCRAPING=true npx tsx scripts/seed-clubs-uzbekistan.ts
 */

import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import { parse2GISClubs, fetch2GISClubsAPI, Club2GISData } from './parse-2gis';
import { downloadImages, getImageUrl } from './image-utils';

const prisma = new PrismaClient();

// Основные города Узбекистана
const UZBEKISTAN_CITIES = [
  { name: 'Ташкент', nameEn: 'Tashkent', slug: 'tashkent', lat: 41.2995, lon: 69.2401, cityKey: 'tashkent' },
  { name: 'Самарканд', nameEn: 'Samarkand', slug: 'samarkand', lat: 39.6542, lon: 66.9597, cityKey: 'samarkand' },
  { name: 'Бухара', nameEn: 'Bukhara', slug: 'bukhara', lat: 39.7747, lon: 64.4286, cityKey: 'bukhara' },
  { name: 'Андижан', nameEn: 'Andijan', slug: 'andijan', lat: 40.7821, lon: 72.3442, cityKey: 'andijan' },
  { name: 'Наманган', nameEn: 'Namangan', slug: 'namangan', lat: 40.9983, lon: 71.6726, cityKey: 'namangan' },
  { name: 'Фергана', nameEn: 'Fergana', slug: 'fergana', lat: 40.3864, lon: 71.7864, cityKey: 'fergana' },
];

// Поисковые запросы для бильярдных
const SEARCH_QUERIES = ['бильярд'];

/**
 * Сохранить фотографии клуба
 */
async function saveClubPhotos(clubId: string, photos: string[]): Promise<void> {
  if (!photos || photos.length === 0) return;

  console.log(`  📸 Сохранение ${photos.length} фотографий...`);

  const uploadsDir = path.join(process.cwd(), 'uploads', 'clubs', clubId);

  try {
    const savedFiles = await downloadImages(photos.slice(0, 10), uploadsDir, 'photo');

    for (let i = 0; i < savedFiles.length; i++) {
      const filename = path.basename(savedFiles[i]);
      await prisma.clubImage.create({
        data: {
          clubId,
          url: getImageUrl(clubId, filename),
          order: i,
        },
      });
    }

    console.log(`  ✅ Сохранено ${savedFiles.length} фотографий`);
  } catch (error) {
    console.error(`  ❌ Ошибка при сохранении фото:`, error);
  }
}

/**
 * Импортировать клуб в БД
 */
async function importClub(club: Club2GISData, cityKey: string): Promise<{ id: string; isNew: boolean } | null> {
  try {
    // Получить или создать страну
    let country = await prisma.country.findFirst({
      where: { name: 'Узбекистан' },
    });

    if (!country) {
      country = await prisma.country.create({
        data: {
          name: 'Узбекистан',
          code: 'UZ',
        },
      });
    }

    // Получить или создать город
    let city = await prisma.city.findFirst({
      where: {
        countryId: country.id,
        OR: [
          { name: { contains: cityKey, mode: 'insensitive' } },
        ]
      },
    });

    if (!city) {
      const cityInfo = UZBEKISTAN_CITIES.find(c => c.cityKey === cityKey);
      city = await prisma.city.create({
        data: {
          name: cityInfo?.name || cityKey,
          countryId: country.id,
        },
      });
    }

    // Проверить, существует ли клуб с таким sourceId
    const existing = await prisma.club.findFirst({
      where: {
        source: '2gis',
        sourceId: club.id,
      },
    });

    if (existing) {
      console.log(`  ⏭️  Клуб уже существует: ${club.name}`);
      return { id: existing.id, isNew: false };
    }

    // Создать клуб
    const newClub = await prisma.club.create({
      data: {
        name: club.name,
        description: club.description || null,
        address: club.address,
        phone: club.phone || null,
        telegram: '',
        tables: 5, // По умолчанию
        disciplines: ['pool', 'pyramid'],
        services: [],
        workingHours: club.workingHours || null,
        coverImageUrl: club.photos?.[0] || null,
        source: '2gis',
        sourceId: club.id,
        countryId: country.id,
        cityId: city.id,
        latitude: club.lat,
        longitude: club.lon,
        lat: club.lat,
        lng: club.lon,
        rating: club.rating || null,
        reviewsCount: club.reviewsCount || 0,
        amenities: [],
        isVerified: false,
      },
    });

    console.log(`  ✅ Создан: ${club.name} (ID: ${newClub.id})`);

    // Сохранить фотографии
    if (club.photos && club.photos.length > 0) {
      await saveClubPhotos(newClub.id, club.photos);
    }

    return { id: newClub.id, isNew: true };
  } catch (error) {
    console.error(`  ❌ Ошибка при импорте клуба ${club.name}:`, error);
    return null;
  }
}

/**
 * Основная функция
 */
async function main() {
  console.log('🚀 Начало парсинга бильярдных клубов Узбекистана из 2GIS\n');

  const useScraping = process.env.USE_SCRAPING === 'true';
  const apiKey = process.env.TWOGIS_API_KEY;

  if (!useScraping && !apiKey) {
    console.log('⚠️  API ключ не найден. Используйте TWOGIS_API_KEY или установите USE_SCRAPING=true\n');
    console.log('Для демонстрации будет использован веб-скрапинг (требует Puppeteer)\n');
  }

  let totalAdded = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // Парсить только Ташкент для демонстрации
  const citiesToParse = UZBEKISTAN_CITIES.slice(0, 1);

  for (const city of citiesToParse) {
    console.log(`\n📍 Город: ${city.name} (${city.nameEn})`);

    for (const query of SEARCH_QUERIES) {
      let clubs: Club2GISData[] = [];

      try {
        if (apiKey && !useScraping) {
          // Использовать API
          console.log(`🔑 Использование 2GIS API...`);
          clubs = await fetch2GISClubsAPI(query, city.lat, city.lon, apiKey);
        } else {
          // Использовать веб-скрапинг
          console.log(`🌐 Использование веб-скрапинга...`);
          clubs = await parse2GISClubs(city.slug, query);
        }

        console.log(`📋 Найдено клубов: ${clubs.length}\n`);

        for (const club of clubs) {
          const result = await importClub(club, city.cityKey);
          if (result) {
            if (result.isNew) {
              totalAdded++;
            } else {
              totalSkipped++;
            }
          } else {
            totalErrors++;
          }

          // Задержка между импортами
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.error(`❌ Ошибка при парсинге:`, error);
        totalErrors++;
      }

      // Задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n✨ Готово!`);
  console.log(`   Добавлено: ${totalAdded}`);
  console.log(`   Пропущено: ${totalSkipped}`);
  console.log(`   Ошибок: ${totalErrors}`);
}

// Запуск
main()
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
