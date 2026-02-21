"use client";

import { useState } from "react";
import { Link2, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";

interface ShareButtonProps {
  destination: DeepPartial<DestinationSuggestion>;
  size?: "sm" | "md";
}

export function ShareButton({ destination, size = "md" }: ShareButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "copied">("idle");
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();

    if (state === "copied" && shareUrl) {
      await navigator.clipboard.writeText(window.location.origin + shareUrl);
      return;
    }

    if (state === "loading") return;
    setState("loading");

    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationData: destination }),
      });

      if (!res.ok) throw new Error("Failed to create share link");

      const data = await res.json();
      const fullUrl = window.location.origin + data.url;
      setShareUrl(data.url);

      await navigator.clipboard.writeText(fullUrl);
      setState("copied");

      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("idle");
    }
  }

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btnSize = size === "sm" ? "p-1.5" : "p-2";

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className={cn(
        btnSize,
        "rounded-full border transition-all",
        state === "copied"
          ? "bg-green-50 border-green-200 text-green-600 dark:bg-green-950 dark:border-green-800"
          : "border-border text-muted-foreground hover:text-primary hover:border-primary/30",
        state === "loading" && "opacity-50"
      )}
      title={state === "copied" ? "Link copied!" : "Share this trip"}
    >
      {state === "loading" ? (
        <Loader2 className={cn(iconSize, "animate-spin")} />
      ) : state === "copied" ? (
        <Check className={iconSize} />
      ) : (
        <Link2 className={iconSize} />
      )}
    </button>
  );
}
