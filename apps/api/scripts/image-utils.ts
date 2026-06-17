/**
 * Утилиты для работы с изображениями клубов
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

export interface DownloadImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Скачать изображение по URL
 */
export async function downloadImage(
  url: string,
  filepath: string,
  options: DownloadImageOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Создать директорию если не существует
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(filepath);
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      // Проверить статус
      if (response.statusCode !== 200) {
        reject(new Error(`Ошибка загрузки: HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    request.on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });

    file.on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

/**
 * Скачать несколько изображений параллельно
 */
export async function downloadImages(
  urls: string[],
  destDir: string,
  prefix: string = 'image'
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const ext = getExtensionFromUrl(url) || '.jpg';
    const filename = `${prefix}-${i}${ext}`;
    const filepath = path.join(destDir, filename);

    try {
      await downloadImage(url, filepath);
      results.push(filepath);
      console.log(`  ✅ Скачано: ${filename}`);
    } catch (error) {
      console.error(`  ❌ Ошибка загрузки ${url}:`, error);
    }
  }

  return results;
}

/**
 * Получить расширение файла из URL
 */
function getExtensionFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const ext = path.extname(pathname);

    if (ext && ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext.toLowerCase())) {
      return ext.toLowerCase();
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Получить размер изображения
 */
export function getImageSize(filepath: string): { width: number; height: number } | null {
  // Примитивная реализация без библиотек
  // В продакшене лучше использовать sharp или image-size
  try {
    const buffer = fs.readFileSync(filepath);

    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    // JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) break;
        const marker = buffer[offset + 1];
        offset += 2;

        if (marker === 0xC0 || marker === 0xC2) {
          const height = buffer.readUInt16BE(offset + 1);
          const width = buffer.readUInt16BE(offset + 3);
          return { width, height };
        }

        const length = buffer.readUInt16BE(offset);
        offset += length;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Очистить директорию uploads для клуба
 */
export function cleanupClubUploads(clubId: string): void {
  const dir = path.join(process.cwd(), 'uploads', 'clubs', clubId);

  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Получить относительный путь для URL изображения
 */
export function getImageUrl(clubId: string, filename: string): string {
  return `/uploads/clubs/${clubId}/${filename}`;
}
