import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const packages = [
    {
      name: "Bronze",
      mediaMode: "PHOTO_ONLY",
      includedFrameDesigns: 1,
      accessDurationDays: 7,
      price: 200000,
    },
    {
      name: "Silver",
      mediaMode: "PHOTO_AND_VOICE",
      includedFrameDesigns: 2,
      accessDurationDays: 10,
      price: 300000,
    },
    {
      name: "Gold",
      mediaMode: "PHOTO_AND_VOICE",
      includedFrameDesigns: 3,
      accessDurationDays: 14,
      price: 400000,
    },
  ];

  for (const pkg of packages) {
    const existing = await prisma.boothPackage.findFirst({
      where: { name: pkg.name },
    });
    if (existing) {
      await prisma.boothPackage.update({ where: { id: existing.id }, data: pkg });
    } else {
      await prisma.boothPackage.create({ data: pkg });
    }
  }

  console.log("Seed selesai: 3 paket (Bronze, Silver, Gold) siap dipakai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
