import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";

export async function POST(req: NextRequest) {
  const { email, password, firstName, lastName, state } = await req.json();

  if (!email || !password || !firstName || !lastName || !state) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
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

  return NextResponse.json(
    { message: "User created", userId: user.id },
    { status: 201 }
  );
}