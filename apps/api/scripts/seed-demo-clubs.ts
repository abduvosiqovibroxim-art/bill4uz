/**
 * Скрипт для создания демонстрационных бильярдных клубов
 *
 * Использование:
 * npx ts-node scripts/seed-demo-clubs.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Демонстрационные клубы с реальными данными
const DEMO_CLUBS = [
  {
    name: 'Бильярдный клуб "Императрица"',
    address: 'ул. Амира Темура, 107, Ташкент',
    lat: 41.311151,
    lng: 69.279737,
    cityName: 'Ташкент',
    phone: '+998 71 234 56 78',
    telegram: '@empress_billiard',
    rating: 4.8,
    reviewsCount: 156,
    tables: 12,
    disciplines: ['Русский бильярд', 'Пул', 'Снукер'],
    amenities: ['wifi', 'parking', 'bar', 'ac', 'music'],
    workHours: 'Ежедневно 10:00 - 02:00',
    description: 'Премиальный бильярдный клуб в центре Ташкента. Профессиональные столы Brunswick, высококлассный сервис, уютная атмосфера.',
    isVerified: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1561830024-47c686fea1c0?w=1200&h=600&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1561830024-47c686fea1c0?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1534329539061-64caeb388c42?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1598622241326-a2f5f9656a9f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1574073887706-da0b2f92ceff?w=800&h=600&fit=crop'
    ]
  },
  {
    name: 'Billiard Hall "Pyramid"',
    address: 'пр. Мустакиллик, 58, Ташкент',
    lat: 41.315299,
    lng: 69.278305,
    cityName: 'Ташкент',
    phone: '+998 71 345 67 89',
    telegram: '@pyramid_billiard',
    rating: 4.5,
    reviewsCount: 89,
    tables: 8,
    disciplines: ['Русский бильярд', 'Пул'],
    amenities: ['wifi', 'parking', 'cafe', 'ac', 'tv'],
    workHours: 'Пн-Вс 12:00 - 00:00',
    description: 'Современный бильярдный зал с комфортной зоной отдыха. Идеально для игры с друзьями или деловых встреч.',
    isVerified: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1534329539061-64caeb388c42?w=1200&h=600&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1534329539061-64caeb388c42?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1598622241326-a2f5f9656a9f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1561830024-47c686fea1c0?w=800&h=600&fit=crop'
    ]
  },
  {
    name: 'Бильярдный центр "Олимп"',
    address: 'ул. Бобура, 12, Ташкент',
    lat: 41.325641,
    lng: 69.289057,
    cityName: 'Ташкент',
    phone: '+998 71 456 78 90',
    telegram: '@olymp_billiard',
    rating: 4.6,
    reviewsCount: 112,
    tables: 15,
    disciplines: ['Русский бильярд', 'Пул', 'Снукер'],
    amenities: ['wifi', 'parking', 'bar', 'restaurant', 'ac', 'hookah', 'music'],
    workHours: 'Круглосуточно',
    description: 'Крупнейший бильярдный центр Ташкента. 15 столов, ресторан, бар, кальянная. Проводим турниры и корпоративные мероприятия.',
    isVerified: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1574073887706-da0b2f92ceff?w=1200&h=600&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1574073887706-da0b2f92ceff?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1561830024-47c686fea1c0?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1534329539061-64caeb388c42?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1598622241326-a2f5f9656a9f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=600&fit=crop'
    ]
  },
  {
    name: 'Клуб "9 шаров"',
    address: 'ул. Шота Руставели, 45, Ташкент',
    lat: 41.318192,
    lng: 69.283261,
    cityName: 'Ташкент',
    phone: '+998 71 567 89 01',
    telegram: '@nineball_uz',
    rating: 4.3,
    reviewsCount: 67,
    tables: 6,
    disciplines: ['Пул'],
    amenities: ['wifi', 'parking', 'cafe', 'ac'],
    workHours: 'Ежедневно 14:00 - 02:00',
    description: 'Уютный клуб для любителей пула. Специализируемся на 9-ball и 8-ball. Дружественная атмосфера, доступные цены.',
    isVerified: false,
    coverImageUrl: 'https://images.unsplash.com/photo-1598622241326-a2f5f9656a9f?w=1200&h=600&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1598622241326-a2f5f9656a9f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1534329539061-64caeb388c42?w=800&h=600&fit=crop'
    ]
  },
  {
    name: 'Royal Billiard',
    address: 'ул. Афросиаб, 23, Самарканд',
    lat: 39.654205,
    lng: 66.975629,
    cityName: 'Самарканд',
    phone: '+998 66 234 56 78',
    telegram: '@royal_billiard_samarkand',
    rating: 4.7,
    reviewsCount: 45,
    tables: 10,
    disciplines: ['Русский бильярд', 'Пул'],
    amenities: ['wifi', 'parking', 'bar', 'ac', 'terrace'],
    workHours: 'Ежедневно 11:00 - 01:00',
    description: 'Лучший бильярдный клуб Самарканда. Летняя терраса, профессиональное оборудование, квалифицированный персонал.',
    isVerified: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&h=600&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1574073887706-da0b2f92ceff?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1561830024-47c686fea1c0?w=800&h=600&fit=crop'
    ]
  }
];

async function main() {
  console.log('🚀 Создание демонстрационных бильярдных клубов\n');

  try {
    // Получить или создать страну Узбекистан
    let country = await prisma.country.findFirst({
      where: { code: 'UZ' }
    });

    if (!country) {
      country = await prisma.country.create({
        data: {
          code: 'UZ',
          name: 'Узбекистан'
        }
      });
      console.log('✅ Создана страна: Узбекистан');
    }

    // Создать города если их нет
    const cities = [
      { name: 'Ташкент' },
      { name: 'Самарканд' }
    ];

    const cityMap = new Map<string, string>();

    for (const cityData of cities) {
      let city = await prisma.city.findFirst({
        where: {
          name: cityData.name,
          countryId: country.id
        }
      });

      if (!city) {
        city = await prisma.city.create({
          data: {
            countryId: country.id,
            name: cityData.name
          }
        });
        console.log(`✅ Создан город: ${cityData.name}`);
      }

      cityMap.set(cityData.name, city.id);
    }

    // Создать клубы
    let created = 0;
    let skipped = 0;

    for (const clubData of DEMO_CLUBS) {
      const existingClub = await prisma.club.findFirst({
        where: {
          name: clubData.name
        }
      });

      if (existingClub) {
        console.log(`⏭️  Пропущен (уже существует): ${clubData.name}`);
        skipped++;
        continue;
      }

      const cityId = cityMap.get(clubData.cityName);
      if (!cityId) {
        console.error(`❌ Город не найден для: ${clubData.cityName}`);
        continue;
      }

      // Создать клуб
      const club = await prisma.club.create({
        data: {
          countryId: country.id,
          cityId: cityId,
          name: clubData.name,
          address: clubData.address,
          latitude: clubData.lat,
          longitude: clubData.lng,
          phone: clubData.phone || '',
          telegram: clubData.telegram,
          rating: clubData.rating,
          reviewsCount: clubData.reviewsCount,
          tables: clubData.tables,
          disciplines: clubData.disciplines,
          amenities: clubData.amenities,
          workingHours: clubData.workHours,
          description: clubData.description,
          isVerified: clubData.isVerified,
          coverImageUrl: clubData.coverImageUrl,
          source: 'manual'
        }
      });

      // Создать галерею
      if (clubData.gallery && clubData.gallery.length > 0) {
        for (let i = 0; i < clubData.gallery.length; i++) {
          await prisma.clubImage.create({
            data: {
              clubId: club.id,
              url: clubData.gallery[i],
              order: i
            }
          });
        }
      }

      console.log(`✅ Создан клуб: ${clubData.name} (${clubData.gallery.length} фото)`);
      created++;
    }

    console.log('\n✨ Готово!');
    console.log(`   Создано: ${created}`);
    console.log(`   Пропущено: ${skipped}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
