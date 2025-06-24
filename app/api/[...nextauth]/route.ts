import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";

console.log("🔌 Initializing NextAuth route handler");

let handler: ReturnType<typeof NextAuth>;

try {
  if (!process.env.NEXTAUTH_SECRET) {
    console.warn("⚠️ NEXTAUTH_SECRET is undefined! Check your .env file.");
  }

  handler = NextAuth(authOptions);
  console.log("✅ NextAuth handler initialized successfully");
} catch (err) {
  console.error("🔥 Failed to initialize NextAuth handler:", err);
  handler = async () => new Response("Internal Server Error", { status: 500 });
}

export const GET = handler;
export const POST = handler;