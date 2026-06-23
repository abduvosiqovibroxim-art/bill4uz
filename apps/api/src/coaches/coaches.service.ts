import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import { CoachListQueryDto } from "./dto";

const coachListInclude = Prisma.validator<Prisma.CoachInclude>()({
  city: { select: { id: true, name: true } },
  country: { select: { id: true, name: true } },
  club: { select: { id: true, name: true } }
});

const coachDetailInclude = Prisma.validator<Prisma.CoachInclude>()({
  city: { select: { id: true, name: true } },
  country: { select: { id: true, name: true } },
  club: { select: { id: true, name: true } },
  gallery: { orderBy: { order: "asc" }, select: { id: true, url: true } },
  reviews: { orderBy: { createdAt: "desc" }, select: { id: true, authorName: true, rating: true, text: true, createdAt: true } },
  students: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, achievement: true } }
});

type CoachListRecord = Prisma.CoachGetPayload<{ include: typeof coachListInclude }>;
type CoachDetailRecord = Prisma.CoachGetPayload<{ include: typeof coachDetailInclude }>;

@Injectable()
export class CoachesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CoachListQueryDto) {
    const where: Prisma.CoachWhereInput = {};

    if (query.search?.trim()) {
      where.fullName = { contains: query.search.trim(), mode: "insensitive" };
    }
    if (query.cityId) {
      where.cityId = query.cityId;
    }
    if (query.region) {
      where.region = query.region;
    }
    if (query.discipline) {
      where.disciplines = { has: query.discipline };
    }
    if (isQualification(query.qualification)) {
      where.qualification = query.qualification;
    }

    const coaches = await this.prisma.coach.findMany({
      where,
      include: coachListInclude,
      orderBy: [{ rating: "desc" }, { fullName: "asc" }]
    });

    return coaches.map((coach) => this.serializeSummary(coach));
  }

  async findOne(id: string) {
    const coach = await this.prisma.coach.findUnique({
      where: { id },
      include: coachDetailInclude
    });

    if (!coach) {
      return null;
    }

    return this.serializeDetail(coach);
  }

  private serializeSummary(coach: CoachListRecord) {
    return {
      id: coach.id,
      fullName: coach.fullName,
      photoUrl: coach.photoUrl,
      region: coach.region,
      cityId: coach.cityId,
      cityName: coach.city?.name ?? null,
      countryId: coach.countryId,
      countryName: coach.country?.name ?? null,
      clubId: coach.clubId,
      clubName: coach.club?.name ?? null,
      qualification: coach.qualification,
      specialization: coach.specialization,
      disciplines: coach.disciplines,
      experienceYears: coach.experienceYears,
      studentsCount: coach.studentsCount,
      personalPriceMinor: coach.personalPriceMinor,
      groupPriceMinor: coach.groupPriceMinor,
      bio: coach.bio,
      rating: coach.rating
    };
  }

  private serializeDetail(coach: CoachDetailRecord) {
    return {
      ...this.serializeSummary(coach),
      achievements: coach.achievements,
      phone: coach.phone,
      telegram: coach.telegram,
      gallery: coach.gallery.map((image) => ({ id: image.id, url: image.url })),
      reviews: coach.reviews.map((review) => ({
        id: review.id,
        authorName: review.authorName,
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt.toISOString()
      })),
      students: coach.students.map((student) => ({
        id: student.id,
        name: student.name,
        achievement: student.achievement
      }))
    };
  }
}

const QUALIFICATIONS = ["INSTRUCTOR", "MASTER", "INTERNATIONAL_MASTER", "HONORED_COACH"] as const;
type Qualification = (typeof QUALIFICATIONS)[number];

function isQualification(value: string | undefined): value is Qualification {
  return Boolean(value) && (QUALIFICATIONS as readonly string[]).includes(value as string);
}
