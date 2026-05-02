import { index, integer, sqliteTable, text, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());

// -----------------------------------------------------------------------------
// Better Auth — users
// -----------------------------------------------------------------------------

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .$defaultFn(() => false),
  image: text("image"),
  role: text("role", { enum: ["customer", "admin"] })
    .notNull()
    .$defaultFn(() => "customer"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// -----------------------------------------------------------------------------
// Better Auth — sessions
// -----------------------------------------------------------------------------

export const sessions = sqliteTable("sessions", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

// -----------------------------------------------------------------------------
// Better Auth — accounts (OAuth + credential store)
// -----------------------------------------------------------------------------

export const accounts = sqliteTable("accounts", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

// -----------------------------------------------------------------------------
// Better Auth — verifications
// -----------------------------------------------------------------------------

export const verifications = sqliteTable("verifications", {
  id: id(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;

// -----------------------------------------------------------------------------
// Categories (self-referential parent)
// -----------------------------------------------------------------------------

export const categories = sqliteTable("categories", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  parentId: text("parent_id").references((): AnySQLiteColumn => categories.id, {
    onDelete: "set null",
  }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

// -----------------------------------------------------------------------------
// Products
// -----------------------------------------------------------------------------

export const products = sqliteTable(
  "products",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    priceCents: integer("price_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    inventory: integer("inventory").notNull().default(0),
    isPublished: integer("is_published", { mode: "boolean" })
      .notNull()
      .$defaultFn(() => true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => ({
    productsCategoryIdx: index("products_category_idx").on(table.categoryId),
  }),
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

// -----------------------------------------------------------------------------
// Product Images
// -----------------------------------------------------------------------------

export const productImages = sqliteTable("product_images", {
  id: id(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: createdAt(),
});

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;

// -----------------------------------------------------------------------------
// Product Variants
// -----------------------------------------------------------------------------

export const productVariants = sqliteTable("product_variants", {
  id: id(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  priceCents: integer("price_cents").notNull(),
  inventory: integer("inventory").notNull().default(0),
  createdAt: createdAt(),
});

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;

// -----------------------------------------------------------------------------
// Addresses
// -----------------------------------------------------------------------------

export const addresses = sqliteTable("addresses", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
  isDefault: integer("is_default", { mode: "boolean" })
    .notNull()
    .$defaultFn(() => false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;

// -----------------------------------------------------------------------------
// Carts (one per user)
// -----------------------------------------------------------------------------

export const carts = sqliteTable("carts", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;

// -----------------------------------------------------------------------------
// Cart Items
// -----------------------------------------------------------------------------

export const cartItems = sqliteTable("cart_items", {
  id: id(),
  cartId: text("cart_id")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  variantId: text("variant_id").references(() => productVariants.id, {
    onDelete: "cascade",
  }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: createdAt(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;

// -----------------------------------------------------------------------------
// Orders
// -----------------------------------------------------------------------------

export const orders = sqliteTable(
  "orders",
  {
    id: id(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: text("status", {
      enum: ["pending", "paid", "fulfilled", "delivered", "cancelled", "failed"],
    })
      .notNull()
      .$defaultFn(() => "pending"),
    subtotalCents: integer("subtotal_cents").notNull(),
    taxCents: integer("tax_cents").notNull().default(0),
    shippingCents: integer("shipping_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    shippingAddressId: text("shipping_address_id").references(() => addresses.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => ({
    ordersUserIdx: index("orders_user_idx").on(table.userId),
    ordersStatusIdx: index("orders_status_idx").on(table.status),
  }),
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

// -----------------------------------------------------------------------------
// Order Items (snapshot pricing)
// -----------------------------------------------------------------------------

export const orderItems = sqliteTable("order_items", {
  id: id(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  variantId: text("variant_id").references(() => productVariants.id, {
    onDelete: "set null",
  }),
  nameSnapshot: text("name_snapshot").notNull(),
  priceCentsSnapshot: integer("price_cents_snapshot").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: createdAt(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
