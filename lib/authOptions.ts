import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Safe export wrapper for runtime errors
let exportedAuthOptions: NextAuthOptions;

try {
  exportedAuthOptions = {
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          console.log("🟡 authorize() called with:", credentials);

          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Missing email or password");
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.log("❌ No user found for:", credentials.email);
            return null;
          }

          if (!user.password) {
            console.log("❌ User has no password set");
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          console.log("✅ Password valid?", isValid);

          return isValid ? user : null;
        },
      }),
    ],

    session: {
      strategy: "jwt",
    },

    pages: {
      signIn: "/auth/signin",
    },

    callbacks: {
      async session({ session, token }) {
        if (session.user && token.sub) {
          session.user.id = token.sub;
        }
        return session;
      },
      async jwt({ token, user }) {
        if (user) {
          token.sub = user.id;
        }
        return token;
      },
    },

    secret: process.env.NEXTAUTH_SECRET,
  };
} catch (err) {
  console.error("🔥 Error while defining authOptions:", err);
  throw err;
}

export const authOptions = exportedAuthOptions;