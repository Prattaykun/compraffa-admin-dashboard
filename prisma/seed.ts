import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const products = [
  { name: "Aurora Wireless Headphones", sku: "AUR-AUD-001", category: "Audio", price: 129.99, stock: 42, status: "active" },
  { name: "Nimbus True Wireless Earbuds", sku: "AUR-AUD-002", category: "Audio", price: 79.99, stock: 120, status: "active" },
  { name: "Halo Smart Speaker Mini", sku: "AUR-AUD-003", category: "Audio", price: 49.99, stock: 0, status: "active" },
  { name: "Pulse Fitness Tracker", sku: "AUR-WEA-001", category: "Wearables", price: 99.0, stock: 65, status: "active" },
  { name: "Orbit Smartwatch 2", sku: "AUR-WEA-002", category: "Wearables", price: 199.0, stock: 28, status: "active" },
  { name: "Lumen Smart Bulb (4-pack)", sku: "AUR-HOM-001", category: "Smart Home", price: 39.99, stock: 210, status: "active" },
  { name: "Sentinel Video Doorbell", sku: "AUR-HOM-002", category: "Smart Home", price: 149.0, stock: 17, status: "active" },
  { name: "Breeze Smart Thermostat", sku: "AUR-HOM-003", category: "Smart Home", price: 179.0, stock: 8, status: "active" },
  { name: "Flux USB-C Hub 8-in-1", sku: "AUR-ACC-001", category: "Accessories", price: 59.99, stock: 95, status: "active" },
  { name: "Volt 65W GaN Charger", sku: "AUR-ACC-002", category: "Accessories", price: 34.99, stock: 150, status: "active" },
  { name: "Drift Laptop Stand", sku: "AUR-ACC-003", category: "Accessories", price: 44.99, stock: 60, status: "draft" },
  { name: "Clarity 4K Webcam", sku: "AUR-CAM-001", category: "Cameras", price: 89.99, stock: 33, status: "active" },
];

const customers = [
  { name: "Ava Martinez", email: "ava.martinez@example.com" },
  { name: "Liam O'Connor", email: "liam.oconnor@example.com" },
  { name: "Sofia Rossi", email: "sofia.rossi@example.com" },
  { name: "Noah Kim", email: "noah.kim@example.com" },
  { name: "Emma Novak", email: "emma.novak@example.com" },
  { name: "Lucas Silva", email: "lucas.silva@example.com" },
  { name: "Mia Tanaka", email: "mia.tanaka@example.com" },
  { name: "Ethan Wright", email: "ethan.wright@example.com" },
];

const statuses = ["delivered", "delivered", "shipped", "paid", "pending", "delivered", "cancelled"];

// Deterministic PRNG so reseeding produces the same demo data.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);
  await prisma.user.upsert({
    where: { email: "demo@aurora.store" },
    update: {},
    create: { name: "Demo Admin", email: "demo@aurora.store", passwordHash },
  });

  const createdProducts = [];
  for (const p of products) createdProducts.push(await prisma.product.create({ data: p }));

  const createdCustomers = [];
  for (const c of customers) createdCustomers.push(await prisma.customer.create({ data: c }));

  const rand = mulberry32(20261025);
  const now = Date.now();
  let orderSeq = 1000;

  for (let i = 0; i < 46; i++) {
    const daysAgo = Math.floor(rand() * 45);
    const createdAt = new Date(now - daysAgo * 86400000 - Math.floor(rand() * 86400000 / 2));
    const customer = createdCustomers[Math.floor(rand() * createdCustomers.length)];
    const itemCount = 1 + Math.floor(rand() * 3);
    const chosen = new Set<number>();
    const items = [];
    for (let j = 0; j < itemCount; j++) {
      let idx = Math.floor(rand() * createdProducts.length);
      while (chosen.has(idx)) idx = Math.floor(rand() * createdProducts.length);
      chosen.add(idx);
      const product = createdProducts[idx];
      items.push({ productId: product.id, quantity: 1 + Math.floor(rand() * 3), unitPrice: product.price });
    }
    const total = Math.round(items.reduce((s, it) => s + it.quantity * it.unitPrice, 0) * 100) / 100;
    const status = statuses[Math.floor(rand() * statuses.length)];

    await prisma.order.create({
      data: {
        orderNumber: `AUR-${orderSeq++}`,
        status,
        total,
        createdAt,
        customerId: customer.id,
        items: { create: items },
      },
    });
  }

  console.log(`Seeded ${createdProducts.length} products, ${createdCustomers.length} customers, 46 orders, demo user demo@aurora.store / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
