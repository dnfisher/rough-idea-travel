"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { ShareModal } from "./ShareModal";

interface ShareButtonProps {
  destination: DeepPartial<DestinationSuggestion>;
  size?: "sm" | "md";
}

export function ShareButton({ destination, size = "md" }: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btnSize = size === "sm" ? "p-1.5" : "p-2";

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        className={cn(
          btnSize,
          "rounded-full border border-border text-muted-foreground transition-all",
          "hover:text-primary hover:border-primary/30"
        )}
        title="Share this trip"
      >
        <Link2 className={iconSize} />
      </button>
      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        destination={destination}
      />
    </>
  );
}
