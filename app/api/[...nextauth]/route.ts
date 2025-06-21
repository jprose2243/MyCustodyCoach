import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";

console.log("🔌 Initializing NextAuth route handler");

if (!process.env.NEXTAUTH_SECRET) {
  console.warn("⚠️ NEXTAUTH_SECRET is undefined! Check your .env file.");
}

const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;