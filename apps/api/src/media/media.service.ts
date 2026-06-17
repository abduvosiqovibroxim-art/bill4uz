import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import type { LocalizedTextDto } from "../tournaments/dto";
import { MediaComputedFields } from "./dto";

const galleryInclude = Prisma.validator<Prisma.GalleryInclude>()({
  assets: true
});

type GalleryRecord = Prisma.GalleryGetPayload<{ include: typeof galleryInclude }>;
type GalleryResponse = GalleryRecord & MediaComputedFields;

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async galleries(): Promise<GalleryResponse[]> {
    const galleries = await this.prisma.gallery.findMany({ include: galleryInclude });
    return galleries.map((gallery) => ({
      ...gallery,
      typeKey: this.toTypeKey(gallery.assets[0]?.type),
      description: this.buildDescription(gallery)
    }));
  }

  private toTypeKey(type?: string): string {
    switch ((type ?? "").toLowerCase()) {
      case "video":
        return "highlights";
      case "image":
        return "report";
      default:
        return "interview";
    }
  }

  private buildDescription(gallery: GalleryRecord): LocalizedTextDto {
    const assetCount = gallery.assets.length;
    const typeLabel = this.toTypeKey(gallery.assets[0]?.type);
    const ruType = typeLabel === "highlights" ? "хайлайты" : typeLabel === "report" ? "репортажи" : "интервью";
    const uzType = typeLabel === "highlights" ? "highlightlar" : typeLabel === "report" ? "reportajlar" : "intervyular";
    const enType = typeLabel === "highlights" ? "highlights" : typeLabel === "report" ? "reports" : "interviews";
    return this.localizedText(
      `${gallery.title}: ${assetCount} медиаматериал${assetCount === 1 ? "" : assetCount < 5 ? "а" : "ов"} в подборке ${ruType}.`,
      `${gallery.title}: ${assetCount} ta media material ${uzType} to'plamida.`,
      `${gallery.title}: ${assetCount} media item${assetCount === 1 ? "" : "s"} in the ${enType} collection.`
    );
  }

  private localizedText(ru: string, uz: string, en: string): LocalizedTextDto {
    return { ru, uz, en };
  }
}
