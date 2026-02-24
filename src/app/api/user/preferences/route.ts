import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isValidCurrency } from "@/lib/currency";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({ currency: users.currency })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return NextResponse.json({ currency: user?.currency ?? "EUR" });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { currency } = body;

  if (!currency || !isValidCurrency(currency)) {
    return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ currency })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ currency });
}
