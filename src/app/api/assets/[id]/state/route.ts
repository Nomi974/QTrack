import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const a = await prisma.asset.findUnique({
    where: { id },
    select: {
      id: true,
      serialNo: true,
      category: true,
      status: true,
      condition: true,
      currentLocationId: true,
      isFixed: true,
    },
  });
  if (!a) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(a);
}
