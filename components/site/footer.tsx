import Link from "next/link";

import { Separator } from "@/components/ui/separator";

const shopLinks = [
  { label: "All products", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "New arrivals", href: "/products?sort=newest" },
];

const accountLinks = [
  { label: "Sign in", href: "/sign-in" },
  { label: "Sign up", href: "/sign-up" },
  { label: "My orders", href: "/account/orders" },
];

const aboutLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold">Local Ecommerce</h3>
            <p className="text-muted-foreground text-sm">A self-contained local commerce demo.</p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Shop</h3>
            <ul className="space-y-2">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Account</h3>
            <ul className="space-y-2">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">About</h3>
            <ul className="space-y-2">
              {aboutLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} Local Ecommerce. Built locally.
          </p>
          <p className="text-muted-foreground text-xs">Test mode &mdash; no real payments.</p>
        </div>
      </div>
    </footer>
  );
}
