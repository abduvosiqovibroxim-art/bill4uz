import { PrismaClient, CoachQualification } from "@prisma/client";

const prisma = new PrismaClient();

// Coaches that must always exist locally (idempotent: matched by fullName).
const COACHES = [
  {
    fullName: "Tashpulatov Abduvosit Abduvosikovich",
    photoUrl: "/coaches/coach-judge-1.jpg",
    specialization: "Мастер",
    qualification: CoachQualification.INSTRUCTOR,
    cityName: "Tashkent",
    disciplines: ["Свободная пирамида"]
  },
  {
    fullName: "Khudoyberdiyev Tolagan Elmurod o'g'li",
    photoUrl: "/coaches/coach-khudoyberdiyev.jpg",
    specialization: "Мастер",
    qualification: CoachQualification.MASTER,
    cityName: "Tashkent",
    disciplines: ["Русская пирамида", "Снукер"]
  }
] as const;

async function main() {
  const country = await prisma.country.upsert({
    where: { code: "UZ" },
    update: { name: "Uzbekistan" },
    create: { code: "UZ", name: "Uzbekistan" }
  });

  const results = [];
  for (const def of COACHES) {
    const city = await prisma.city.upsert({
      where: { countryId_name: { countryId: country.id, name: def.cityName } },
      update: {},
      create: { countryId: country.id, name: def.cityName }
    });

    const existing = await prisma.coach.findFirst({ where: { fullName: def.fullName } });
    const data = {
      fullName: def.fullName,
      photoUrl: def.photoUrl,
      specialization: def.specialization,
      qualification: def.qualification,
      countryId: country.id,
      cityId: city.id,
      disciplines: [...def.disciplines]
    };

    const coach = existing
      ? await prisma.coach.update({ where: { id: existing.id }, data })
      : await prisma.coach.create({ data });

    results.push({ id: coach.id, fullName: coach.fullName, photoUrl: coach.photoUrl, specialization: coach.specialization });
  }

  console.log(JSON.stringify({ status: "ok", coaches: results }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
