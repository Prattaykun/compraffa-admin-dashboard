import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash: await hashPassword(password) },
  });

  await setSessionCookie(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
}
