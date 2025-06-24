import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName, state } = await req.json();

    if (!email || !password || !firstName || !lastName || !state) {
      console.warn("⚠️ Missing required fields");
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.warn("⚠️ Email already registered:", email);
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        state,
      },
    });

    console.log("✅ New user created:", user.email);

    return NextResponse.json(
      { message: "User created", userId: user.id },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("🔥 Error in /api/register:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}