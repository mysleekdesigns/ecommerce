import Link from "next/link";
import { Lock, Package, ShoppingBag } from "lucide-react";

import { HeroToastButton } from "@/components/site/hero-toast-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Package,
    title: "Real catalog",
    description: "Products, categories, search, filters.",
  },
  {
    icon: ShoppingBag,
    title: "Local cart & checkout",
    description: "Stripe in test mode, no cloud needed.",
  },
  {
    icon: Lock,
    title: "Admin dashboard",
    description: "Manage products, orders, and inventory.",
  },
];

export default function HomePage() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <div className="flex flex-col items-center text-center">
          <Badge variant="secondary">Phase 1 — Foundation</Badge>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Build commerce locally.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-2xl text-lg">
            A self-contained Next.js + Tailwind v4 + shadcn/ui starter. Catalog, cart, auth,
            checkout, admin — all running on a single SQLite file.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button nativeButton={false} render={<Link href="/products" />}>
              Browse products
            </Button>
            <HeroToastButton />
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="text-muted-foreground size-5" aria-hidden />
                <CardTitle className="mt-2">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
