import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { passwordChangeSchema, profileSchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (body?.type === "password") {
    const parsed = passwordChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const row = await prisma.user.findUnique({ where: { id: user.id } });
    if (!row || !(await verifyPassword(parsed.data.currentPassword, row.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });
    return NextResponse.json({ ok: true });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const updated = await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  return NextResponse.json({ user: { id: updated.id, name: updated.name, email: updated.email } });
}
