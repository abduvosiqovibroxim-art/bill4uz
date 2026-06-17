# Скрипты для парсинга бильярдных клубов

## Парсинг клубов Узбекистана из 2GIS

Скрипт `seed-clubs-uzbekistan.ts` автоматически находит и импортирует бильярдные клубы из 2GIS в базу данных Billuz.

### Возможности

- ✅ Парсинг данных о клубах (название, адрес, телефон, координаты)
- ✅ Скачивание фотографий клубов
- ✅ Сохранение рейтингов и отзывов из 2GIS
- ✅ Автоматическое создание стран и городов в БД
- ✅ Проверка дубликатов (по source + sourceId)

### Методы парсинга

#### 1. С API ключом 2GIS (рекомендуется)

**Получение API ключа:**
1. Зарегистрируйтесь на https://api.2gis.com/
2. Создайте проект
3. Скопируйте API ключ

**Запуск:**
```bash
cd apps/api
TWOGIS_API_KEY=your_api_key_here npx tsx scripts/seed-clubs-uzbekistan.ts
```

#### 2. С веб-скрапингом (без API ключа)

**Требования:**
- Установить Puppeteer: `npm install puppeteer`

**Запуск:**
```bash
cd apps/api
USE_SCRAPING=true npx tsx scripts/seed-clubs-uzbekistan.ts
```

> ⚠️ **Внимание:** Веб-скрапинг медленнее и может быть заблокирован 2GIS при частых запросах.

### Города

По умолчанию парсятся следующие города Узбекистана:
- Ташкент
- Самарканд
- Бухара
- Андижан
- Наманган
- Фергана

Для полного парсинга всех городов отредактируйте переменную `citiesToParse` в скрипте:

```typescript
// Парсить все города
const citiesToParse = UZBEKISTAN_CITIES;
```

### Структура данных

Скрипт создает:

**Club** (модель):
- `name` - название клуба
- `address` - адрес
- `phone` - телефон (если указан)
- `latitude`, `longitude` - координаты
- `rating` - рейтинг из 2GIS
- `reviewsCount` - количество отзывов
- `coverImageUrl` - главное фото
- `workingHours` - часы работы
- `source` = "2gis"
- `sourceId` - ID из 2GIS

**ClubImage** (галерея):
- Фотографии клуба сохраняются в `apps/api/uploads/clubs/{clubId}/`
- Максимум 10 фотографий на клуб
- Записи в таблице `ClubImage` с порядком отображения

### Примеры

**Полный парсинг Ташкента с API:**
```bash
TWOGIS_API_KEY=abc123 npx tsx scripts/seed-clubs-uzbekistan.ts
```

**Парсинг со скрапингом:**
```bash
USE_SCRAPING=true npx tsx scripts/seed-clubs-uzbekistan.ts
```

**С дополнительными логами:**
```bash
DEBUG=true TWOGIS_API_KEY=abc123 npx tsx scripts/seed-clubs-uzbekistan.ts
```

### Результаты

После выполнения скрипт выводит статистику:
```
✨ Готово!
   Добавлено: 45
   Пропущено: 3
   Ошибок: 0
```

- **Добавлено**: новые клубы, созданные в БД
- **Пропущено**: клубы, которые уже существуют (по sourceId)
- **Ошибок**: количество ошибок при импорте

### Повторный запуск

При повторном запуске скрипт:
- ✅ Пропускает уже существующие клубы (проверка по `source` + `sourceId`)
- ✅ Не дублирует фотографии
- ✅ Безопасно останавливается при ошибках

### Troubleshooting

**Ошибка: "API ключ не найден"**
```bash
# Решение: добавьте TWOGIS_API_KEY или используйте скрапинг
USE_SCRAPING=true npx tsx scripts/seed-clubs-uzbekistan.ts
```

**Ошибка: "Cannot find module 'puppeteer'"**
```bash
# Решение: установите Puppeteer
cd apps/api
npm install puppeteer
```

**Ошибка при скачивании фото:**
```bash
# Проверьте доступ к интернету и права на запись в uploads/
mkdir -p uploads/clubs
chmod 755 uploads
```

### Продвинутое использование

**Парсить только определенный город:**

Отредактируйте `seed-clubs-uzbekistan.ts`:
```typescript
const citiesToParse = UZBEKISTAN_CITIES.filter(c => c.cityKey === 'tashkent');
```

**Изменить количество фотографий:**

В функции `saveClubPhotos`:
```typescript
const savedFiles = await downloadImages(photos.slice(0, 20), uploadsDir, 'photo');
// Вместо 10 сохранять 20 фотографий
```

**Добавить свои поисковые запросы:**

```typescript
const SEARCH_QUERIES = [
  'бильярд',
  'billiard',
  'pool hall',
  'snooker',
];
```

### Доступ к фотографиям

Фотографии доступны по URL:
```
/uploads/clubs/{clubId}/photo-0.jpg
/uploads/clubs/{clubId}/photo-1.jpg
...
```

Для отдачи статических файлов в NestJS добавьте в `apps/api/src/main.ts`:
```typescript
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Раздача статических файлов
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(3001);
}
```

### Интеграция с frontend

После парсинга клубов они автоматически появятся в:
- Карте booking (`http://localhost:3000/booking`)
- Админ-панели клубов (`http://localhost:3000/dashboard/admin/clubs`)

Фотографии доступны через API:
```typescript
// apps/web/src/lib/api/hooks.ts
export function useClubGalleryQuery(clubId: string) {
  return useQuery({
    queryKey: ['club-gallery', clubId],
    queryFn: () => apiGet<ClubImage[]>(`/clubs/${clubId}/gallery`),
  });
}
```

## Файлы скриптов

- `seed-clubs-uzbekistan.ts` - основной скрипт парсинга
- `parse-2gis.ts` - модуль для работы с 2GIS API и веб-скрапингом
- `image-utils.ts` - утилиты для скачивания и оптимизации изображений
