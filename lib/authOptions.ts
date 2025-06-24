import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Authorize called with:", credentials);

        if (!credentials?.email || !credentials?.password) {
          console.warn("❌ Missing email or password");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          console.warn("❌ User not found or missing password");
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          console.warn("❌ Invalid password for:", credentials.email);
          return null;
        }

        console.log("✅ Auth successful:", {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          state: user.state,
        });

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName ?? "",
          state: user.state ?? "",
        };
      },
    }),
  ],

  // ✅ Custom pages
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    newUser: "/", // Redirect new users after signup (optional)
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string;
          email: string;
          firstName?: string;
          state?: string;
        };

        token.id = u.id;
        token.email = u.email;
        token.firstName = u.firstName ?? "";
        token.state = u.state ?? "";

        console.log("🔁 JWT callback - token enriched:", token);
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          firstName: token.firstName as string,
          state: token.state as string,
        };

        console.log("📦 Session created:", session);
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};