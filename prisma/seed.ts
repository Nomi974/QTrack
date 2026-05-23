// QTrack seed — slim 125-asset inventory (50 chairs + 50 tables + 25 whiteboards),
// all sitting in Lobby Storage. One storage, five rooms, two users.
// Floor-plan coordinates use the 0..1000 grid the FloorPlan component renders.

import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function reset() {
  await prisma.alert.deleteMany();
  await prisma.eventAllocation.deleteMany();
  await prisma.assetEvent.deleteMany();
  await prisma.eventRequest.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();
}

async function main() {
  await reset();

  const users = await prisma.user.createManyAndReturn({
    data: [
      { name: "Noor Al-Thani", email: "noor@qstp.qa", role: "ADMIN",  department: "Operations" },
      { name: "Omar Faisal",   email: "omar@qstp.qa", role: "WORKER", department: "Facilities" },
    ],
  });
  const admin = users.find((u) => u.role === "ADMIN")!;

  const locationsData = [
    { key: "STORAGE",  name: "Lobby Storage",       type: "STORAGE",     x: 40,  y: 40,  width: 300, height: 220, capacity: 500 },
    { key: "CONF_1",   name: "Conference Hall 1",   type: "EVENT_SPACE", x: 380, y: 40,  width: 270, height: 160, capacity: 60  },
    { key: "CONF_2",   name: "Conference Hall 2",   type: "EVENT_SPACE", x: 680, y: 40,  width: 270, height: 160, capacity: 60  },
    { key: "AUDI",     name: "Auditorium",          type: "EVENT_SPACE", x: 380, y: 230, width: 570, height: 200, capacity: 200 },
    { key: "LECTURE",  name: "Lecture Theater",     type: "EVENT_SPACE", x: 40,  y: 290, width: 300, height: 180, capacity: 80  },
    { key: "BOARD",    name: "Boardroom",           type: "ROOM",        x: 380, y: 460, width: 270, height: 150, capacity: 14  },
    { key: "OUTSIDE",  name: "Outside Campus",      type: "OUTSIDE",     x: 0,   y: 880, width: 950, height: 80,  capacity: null },
  ];

  const locations = await Promise.all(
    locationsData.map((loc) =>
      prisma.location.create({
        data: {
          name: loc.name,
          type: loc.type,
          building: "Main",
          floor: 1,
          x: loc.x,
          y: loc.y,
          width: loc.width,
          height: loc.height,
          capacity: loc.capacity ?? null,
        },
      }),
    ),
  );
  const locByKey = Object.fromEntries(
    locationsData.map((l, i) => [l.key, locations[i]]),
  );
  const storage = locByKey["STORAGE"];

  type Spec = { prefix: string; category: string; count: number; price: number; brand: string; model: string };
  const specs: Spec[] = [
    { prefix: "CHR", category: "Chair",      count: 50, price: 85,  brand: "Steelcase", model: "Series-C" },
    { prefix: "TBL", category: "Table",      count: 50, price: 450, brand: "Steelcase", model: "FrameOne" },
    { prefix: "WBD", category: "Whiteboard", count: 25, price: 320, brand: "Quartet",   model: "Prestige 2" },
  ];

  let total = 0;
  for (const s of specs) {
    for (let i = 1; i <= s.count; i++) {
      const serial = `QSTP-${s.prefix}-${String(i).padStart(4, "0")}`;
      const asset = await prisma.asset.create({
        data: {
          serialNo: serial,
          category: s.category,
          brand: s.brand,
          model: s.model,
          purchaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * (90 + Math.floor(Math.random() * 365))),
          purchasePrice: s.price,
          isFixed: false,
          status: "IN_STORAGE",
          condition: "GOOD",
          currentLocationId: storage.id,
        },
      });
      await prisma.assetEvent.create({
        data: {
          assetId: asset.id,
          eventType: "ADOPTED",
          locationId: storage.id,
          actorId: admin.id,
          conditionAfter: "GOOD",
          statusAfter: "IN_STORAGE",
          source: "SYSTEM",
          notes: "Registered in Lobby Storage at QTrack rollout.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (5 + Math.floor(Math.random() * 30))),
        },
      });
      total++;
    }
  }

  console.log(`✓ Seeded ${users.length} users, ${locations.length} locations, ${total} assets.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
