import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [, , email, password, name] = process.argv;

  if (!email || !password || !name) {
    console.error(
      "Pemakaian: npm run create-vendor -- <email> <password> <nama>\n" +
        'Contoh: npm run create-vendor -- kamu@mioribooth.com rahasia123 "Miori Booth"'
    );
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);

  const vendor = await prisma.vendor.upsert({
    where: { email },
    update: { password: hashed, name },
    create: { email, password: hashed, name },
  });

  console.log(`Vendor siap dipakai login: ${vendor.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
