import { Injectable } from "@nestjs/common";
import { News } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import type { LocalizedTextDto } from "../tournaments/dto";
import { CreateNewsDto, NewsComputedFields, UpdateNewsDto } from "./dto";

type NewsResponse = Omit<News, "title" | "content"> & {
  title: string | LocalizedTextDto;
  content: string | LocalizedTextDto;
} & NewsComputedFields;

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<NewsResponse[]> {
    const news = await this.prisma.news.findMany({ orderBy: { publishedAt: "desc" } });
    return news.map((item) => this.serializeNews(item));
  }

  async findOne(id: string): Promise<NewsResponse | null> {
    const item = await this.prisma.news.findUnique({ where: { id } });
    return item ? this.serializeNews(item) : null;
  }

  create(dto: CreateNewsDto) {
    return this.prisma.news.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        category: dto.category,
        content: dto.content,
        publishedAt: new Date(dto.publishedAt)
      }
    });
  }

  update(id: string, dto: UpdateNewsDto) {
    return this.prisma.news.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug,
        category: dto.category,
        content: dto.content,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined
      }
    });
  }

  remove(id: string) {
    return this.prisma.news.delete({
      where: { id },
      select: { id: true }
    });
  }

  private serializeNews(news: News): NewsResponse {
    const localized = this.localizedNews(news);
    return {
      ...news,
      title: localized.title,
      content: localized.content,
      excerpt: localized.excerpt,
      categoryKey: this.toCategoryKey(news.category)
    };
  }

  private toCategoryKey(category: string): string {
    switch (category.toLowerCase().replace(/[^a-z0-9]+/g, "")) {
      case "tournament":
        return "tournament";
      case "product":
        return "product";
      case "media":
        return "media";
      default:
        return "platform";
    }
  }

  private localizedNews(news: News): { title: LocalizedTextDto; content: LocalizedTextDto; excerpt: LocalizedTextDto } {
    const title = this.localizedText(news.title, news.title, news.title);
    const content = this.localizedText(news.content, news.content, news.content);
    const excerptSource = news.content.length <= 120 ? news.content : `${news.content.slice(0, 117).trimEnd()}...`;

    return {
      title,
      content,
      excerpt: this.localizedText(excerptSource, excerptSource, excerptSource)
    };
  }

  private localizedText(ru: string, uz: string, en: string): LocalizedTextDto {
    return { ru, uz, en };
  }
}
