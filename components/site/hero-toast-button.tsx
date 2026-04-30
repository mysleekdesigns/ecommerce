"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function HeroToastButton() {
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast.success("Phase 1 setup is working.", {
          description: "Sonner toasts are wired into the root layout.",
        })
      }
    >
      Try a toast
    </Button>
  );
}
