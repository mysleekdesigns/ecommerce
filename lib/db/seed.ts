/**
 * Idempotent seed script for the local ecommerce app.
 *
 * Wipes all seed-affected tables in reverse-FK order, then re-inserts:
 *  - 5 categories
 *  - 25 products (5 per category) with SVG placeholder images
 *  - product variants (S/M/L) for a handful of apparel items
 *  - 2 users (admin + customer); credentials are written by Better Auth in Phase 3
 *
 * Run with: pnpm db:seed (after migrations have been applied).
 */

import { db } from "@/lib/db";
import {
  accounts,
  addresses,
  cartItems,
  carts,
  categories,
  orderItems,
  orders,
  productImages,
  productVariants,
  products,
  sessions,
  users,
  verifications,
  type NewCategory,
  type NewProduct,
  type NewProductImage,
  type NewProductVariant,
  type NewUser,
} from "@/lib/db/schema";

// -----------------------------------------------------------------------------
// Seed data
// -----------------------------------------------------------------------------

type CategorySeed = {
  slug: string;
  name: string;
  description: string;
};

const CATEGORIES: CategorySeed[] = [
  {
    slug: "apparel",
    name: "Apparel",
    description: "Everyday wear, layering pieces, and seasonal staples.",
  },
  {
    slug: "footwear",
    name: "Footwear",
    description: "Shoes, boots, and slip-ons for every kind of step.",
  },
  {
    slug: "accessories",
    name: "Accessories",
    description: "Wallets, eyewear, bags, and finishing touches.",
  },
  {
    slug: "home-goods",
    name: "Home Goods",
    description: "Kitchen, textiles, and small comforts for the home.",
  },
  {
    slug: "electronics",
    name: "Electronics",
    description: "Audio, peripherals, and connected gear for the desk.",
  },
];

type ProductSeed = {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  inventory: number;
  isPublished?: boolean;
  categorySlug: string;
  variants?: { name: string; sku: string; priceCents?: number; inventory: number }[];
};

const PRODUCTS: ProductSeed[] = [
  // Apparel
  {
    slug: "classic-tee",
    name: "Classic Tee",
    description:
      "A heavyweight 100% cotton t-shirt with a relaxed fit. Pre-shrunk and built to outlast the wash cycle.",
    priceCents: 2499,
    inventory: 80,
    categorySlug: "apparel",
    variants: [
      { name: "Small", sku: "APP-TEE-S", inventory: 25 },
      { name: "Medium", sku: "APP-TEE-M", inventory: 30 },
      { name: "Large", sku: "APP-TEE-L", inventory: 25 },
    ],
  },
  {
    slug: "linen-shirt",
    name: "Linen Shirt",
    description:
      "Breathable European linen with a soft camp collar. Perfect for warm weather and easy layering.",
    priceCents: 6899,
    inventory: 35,
    categorySlug: "apparel",
    variants: [
      { name: "Small", sku: "APP-LIN-S", inventory: 10 },
      { name: "Medium", sku: "APP-LIN-M", inventory: 15 },
      { name: "Large", sku: "APP-LIN-L", inventory: 10 },
    ],
  },
  {
    slug: "wool-sweater",
    name: "Wool Sweater",
    description:
      "Mid-weight merino crewneck that blocks chill without bulk. Naturally odor-resistant and machine washable on cool.",
    priceCents: 9999,
    inventory: 22,
    categorySlug: "apparel",
  },
  {
    slug: "denim-jacket",
    name: "Denim Jacket",
    description:
      "A trucker-cut jacket in 12oz selvedge denim with brass hardware. Wears in beautifully over time.",
    priceCents: 12900,
    inventory: 14,
    categorySlug: "apparel",
  },
  {
    slug: "joggers",
    name: "Joggers",
    description:
      "French terry joggers with a tapered leg and zip side pockets. As at-home on a Zoom as on a run.",
    priceCents: 5499,
    inventory: 45,
    isPublished: false, // unpublished — admin-only visibility test
    categorySlug: "apparel",
    variants: [
      { name: "Small", sku: "APP-JOG-S", inventory: 12 },
      { name: "Medium", sku: "APP-JOG-M", inventory: 18 },
      { name: "Large", sku: "APP-JOG-L", inventory: 15 },
    ],
  },

  // Footwear
  {
    slug: "runner-sneakers",
    name: "Runner Sneakers",
    description:
      "Lightweight knit upper with an EVA midsole tuned for daily miles. Reflective heel pull for low-light runs.",
    priceCents: 11900,
    inventory: 40,
    categorySlug: "footwear",
  },
  {
    slug: "leather-boots",
    name: "Leather Boots",
    description:
      "Full-grain leather Chelsea boot with a durable rubber sole and cushioned footbed. Resoleable construction.",
    priceCents: 18500,
    inventory: 18,
    categorySlug: "footwear",
  },
  {
    slug: "canvas-slip-ons",
    name: "Canvas Slip-Ons",
    description:
      "Classic low-profile slip-ons in heavyweight cotton canvas. Vulcanized rubber sole for grip.",
    priceCents: 4499,
    inventory: 60,
    categorySlug: "footwear",
  },
  {
    slug: "trail-hikers",
    name: "Trail Hikers",
    description:
      "Waterproof mid-cut hiker with an aggressive lugged sole. Built for variable terrain and long days out.",
    priceCents: 14900,
    inventory: 24,
    categorySlug: "footwear",
  },
  {
    slug: "dress-loafers",
    name: "Dress Loafers",
    description:
      "Hand-finished penny loafers in burnished calfskin. Leather sole; pairs equally well with denim or a suit.",
    priceCents: 21900,
    inventory: 9,
    categorySlug: "footwear",
  },

  // Accessories
  {
    slug: "leather-wallet",
    name: "Leather Wallet",
    description:
      "Slim bifold in vegetable-tanned leather with six card slots. Develops a personal patina with use.",
    priceCents: 5900,
    inventory: 50,
    categorySlug: "accessories",
  },
  {
    slug: "aviator-sunglasses",
    name: "Aviator Sunglasses",
    description:
      "Polarized aviators with a stainless frame and acetate nose pads. UV400 protection across the lens.",
    priceCents: 7900,
    inventory: 38,
    categorySlug: "accessories",
  },
  {
    slug: "canvas-tote",
    name: "Canvas Tote",
    description:
      "Heavy-duty 16oz cotton canvas tote with reinforced straps and an interior key clip. Built to haul.",
    priceCents: 2899,
    inventory: 75,
    categorySlug: "accessories",
  },
  {
    slug: "knit-beanie",
    name: "Knit Beanie",
    description:
      "Ribbed merino beanie with a cuffed brim. Soft enough to wear all day, warm enough for the commute.",
    priceCents: 2299,
    inventory: 65,
    categorySlug: "accessories",
  },
  {
    slug: "silk-scarf",
    name: "Silk Scarf",
    description: "Hand-rolled mulberry silk square in a limited print. Gift-boxed, ready to give.",
    priceCents: 8900,
    inventory: 12,
    categorySlug: "accessories",
  },

  // Home Goods
  {
    slug: "ceramic-mug-set",
    name: "Ceramic Mug Set",
    description:
      "A set of four hand-thrown stoneware mugs. Microwave and dishwasher safe; subtly different by design.",
    priceCents: 4900,
    inventory: 30,
    categorySlug: "home-goods",
  },
  {
    slug: "linen-throw",
    name: "Linen Throw",
    description:
      "Stonewashed Belgian linen throw with a hand-knotted fringe. Gets softer every wash.",
    priceCents: 8500,
    inventory: 20,
    categorySlug: "home-goods",
  },
  {
    slug: "cast-iron-skillet",
    name: "Cast Iron Skillet",
    description:
      "Pre-seasoned 12-inch cast iron skillet for stovetop, oven, or campfire. A pan to hand down.",
    priceCents: 5499,
    inventory: 28,
    categorySlug: "home-goods",
  },
  {
    slug: "bamboo-cutting-board",
    name: "Bamboo Cutting Board",
    description:
      "Edge-grain bamboo board with a juice groove and recessed handles. Knife-friendly and food safe.",
    priceCents: 3499,
    inventory: 42,
    categorySlug: "home-goods",
  },
  {
    slug: "scented-candle",
    name: "Scented Candle",
    description:
      "Soy-blend candle in a hand-poured glass. Notes of cedar, vetiver, and a quiet bonfire. ~50 hr burn.",
    priceCents: 3200,
    inventory: 55,
    categorySlug: "home-goods",
  },

  // Electronics
  {
    slug: "wireless-earbuds",
    name: "Wireless Earbuds",
    description:
      "Active noise-cancelling earbuds with a 30 hr case and USB-C fast charge. IPX5 sweat resistant.",
    priceCents: 14900,
    inventory: 26,
    categorySlug: "electronics",
  },
  {
    slug: "bluetooth-speaker",
    name: "Bluetooth Speaker",
    description:
      "Compact portable speaker with surprising low end and a 16-hour battery. Pairs in stereo with a second unit.",
    priceCents: 9900,
    inventory: 33,
    categorySlug: "electronics",
  },
  {
    slug: "mechanical-keyboard",
    name: "Mechanical Keyboard",
    description:
      "75% wireless mechanical keyboard with hot-swap switches and PBT keycaps. USB-C, Bluetooth, and 2.4 GHz.",
    priceCents: 16900,
    inventory: 19,
    categorySlug: "electronics",
  },
  {
    slug: "usb-c-hub",
    name: "USB-C Hub",
    description:
      "7-in-1 USB-C hub with HDMI 4K@60, gigabit ethernet, SD/microSD, and 100W passthrough charging.",
    priceCents: 5900,
    inventory: 48,
    isPublished: false, // unpublished — admin-only visibility test
    categorySlug: "electronics",
  },
  {
    slug: "smart-lamp",
    name: "Smart Lamp",
    description:
      "Dimmable desk lamp with adjustable color temperature and a built-in wireless charging pad.",
    priceCents: 8900,
    inventory: 22,
    categorySlug: "electronics",
  },
];

const USERS: NewUser[] = [
  {
    email: "admin@local.test",
    name: "Admin",
    role: "admin",
    emailVerified: true,
  },
  {
    email: "customer@local.test",
    name: "Test Customer",
    role: "customer",
    emailVerified: true,
  },
];

// -----------------------------------------------------------------------------
// Seed runner
// -----------------------------------------------------------------------------

function seed() {
  console.log("[seed] starting");

  // better-sqlite3 transactions are synchronous; drizzle's wrapper preserves
  // that — pass a sync callback.
  db.transaction((tx) => {
    // Reverse-FK order. Most of these will already be empty on a fresh db,
    // but the deletes make this script safe to re-run.
    tx.delete(orderItems).run();
    tx.delete(orders).run();
    tx.delete(cartItems).run();
    tx.delete(carts).run();
    tx.delete(addresses).run();
    tx.delete(productImages).run();
    tx.delete(productVariants).run();
    tx.delete(products).run();
    tx.delete(categories).run();
    tx.delete(sessions).run();
    tx.delete(accounts).run();
    tx.delete(verifications).run();
    tx.delete(users).run();

    // Categories
    const categoryRows: NewCategory[] = CATEGORIES.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      imageUrl: `/uploads/seed/category-${c.slug}.svg`,
    }));
    const insertedCategories = tx.insert(categories).values(categoryRows).returning().all();

    const categoryBySlug = new Map(insertedCategories.map((c) => [c.slug, c.id] as const));

    // Products
    const productRows: NewProduct[] = PRODUCTS.map((p) => {
      const categoryId = categoryBySlug.get(p.categorySlug);
      if (!categoryId) {
        throw new Error(
          `[seed] product "${p.slug}" references unknown category "${p.categorySlug}"`,
        );
      }
      return {
        slug: p.slug,
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        currency: "usd",
        categoryId,
        inventory: p.inventory,
        isPublished: p.isPublished ?? true,
      };
    });
    const insertedProducts = tx.insert(products).values(productRows).returning().all();

    const productBySlug = new Map(insertedProducts.map((p) => [p.slug, p.id] as const));

    // Product images — one SVG per product at position 0
    const imageRows: NewProductImage[] = PRODUCTS.map((p) => {
      const productId = productBySlug.get(p.slug);
      if (!productId) {
        throw new Error(`[seed] no inserted id for product slug "${p.slug}"`);
      }
      return {
        productId,
        url: `/uploads/seed/product-${p.slug}.svg`,
        alt: p.name,
        position: 0,
      };
    });
    tx.insert(productImages).values(imageRows).run();

    // Product variants (only for products that declared them)
    const variantRows: NewProductVariant[] = PRODUCTS.flatMap((p) => {
      if (!p.variants?.length) return [];
      const productId = productBySlug.get(p.slug);
      if (!productId) {
        throw new Error(`[seed] no inserted id for variant parent "${p.slug}"`);
      }
      return p.variants.map((v) => ({
        productId,
        name: v.name,
        sku: v.sku,
        priceCents: v.priceCents ?? p.priceCents,
        inventory: v.inventory,
      }));
    });
    if (variantRows.length > 0) {
      tx.insert(productVariants).values(variantRows).run();
    }

    // Users — credentials are owned by Better Auth (Phase 3); seed the rows
    // only so the right roles exist.
    tx.insert(users).values(USERS).run();

    console.log(
      `[seed] inserted: ${insertedCategories.length} categories, ${insertedProducts.length} products, ${imageRows.length} images, ${variantRows.length} variants, ${USERS.length} users`,
    );
  });

  console.log("[seed] done");
}

try {
  seed();
} catch (err) {
  console.error("[seed] failed:", err);
  process.exit(1);
}
