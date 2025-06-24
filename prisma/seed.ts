import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // Ensure .env is loaded

import { prisma } from "../lib/prisma"; // ✅ THIS LINE FIXED
import bcrypt from "bcryptjs";

async function main() {
  const hashed = await bcrypt.hash("pass1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      password: hashed,
      firstName: "Test",
      lastName: "User",
      state: "Colorado",
    },
  });

  console.log("✅ Seeded user:", user);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });