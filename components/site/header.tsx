"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Menu, Moon, Search, ShoppingBag, Sun, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Categories", href: "/categories" },
] as const;

const navLinkClass =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

function SearchForm({ className }: { className?: string }) {
  return (
    <form action="/products" method="get" role="search" className={cn("relative", className)}>
      <Search
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
      />
      <Input
        type="search"
        name="q"
        placeholder="Search products…"
        aria-label="Search products"
        className="pl-9"
      />
    </form>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />
            }
          >
            <Menu />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4">
            <Link
              href="/"
              className="font-semibold tracking-tight"
              onClick={() => setMobileOpen(false)}
            >
              Local Ecommerce
            </Link>
            <SearchForm className="mt-2" />
            <nav className="mt-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <SheetClose
                  key={link.href}
                  render={
                    <Link href={link.href} className={navLinkClass}>
                      {link.label}
                    </Link>
                  }
                />
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="font-semibold tracking-tight">
          Local Ecommerce
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
        </nav>

        <SearchForm className="hidden max-w-sm flex-1 md:block" />

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          <Link
            href="/cart"
            aria-label="Cart"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
          >
            <ShoppingBag />
            <Badge
              variant="default"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]"
            >
              0
            </Badge>
            <span className="sr-only">Cart</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" aria-label="Account" />}
            >
              <User />
              <span className="sr-only">Account</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem render={<Link href="/sign-in">Sign in</Link>} />
              <DropdownMenuItem render={<Link href="/sign-up">Sign up</Link>} />
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/account/orders">My orders</Link>} />
              <DropdownMenuItem render={<Link href="/account/profile">Profile</Link>} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
