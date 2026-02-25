"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Link2, Check, Loader2, Mail, MessageCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: DeepPartial<DestinationSuggestion>;
}

export function ShareModal({ isOpen, onClose, destination }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [fullUrl, setFullUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHasNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  // Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  // Fetch share URL when modal opens
  useEffect(() => {
    if (!isOpen || shareUrl) return;
    setLoading(true);
    setError(null);

    fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinationData: destination }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create share link");
        return res.json();
      })
      .then((data) => {
        setShareUrl(data.url);
        setFullUrl(window.location.origin + data.url);
      })
      .catch(() => {
        setError("Could not create share link. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [isOpen, shareUrl, destination]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setError(null);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    }
  }, [isOpen]);

  async function handleCopyLink() {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 3000);
    } catch {
      setError("Could not copy to clipboard. Try selecting the URL manually.");
    }
  }

  async function handleNativeShare() {
    if (!fullUrl || !navigator.share) return;
    try {
      await navigator.share({
        title: `Check out ${destination.name ?? "this destination"} on Rough Idea`,
        url: fullUrl,
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Share failed. Try copying the link instead.");
      }
    }
  }

  function handleRetry() {
    setShareUrl(null);
    setFullUrl(null);
    setError(null);
  }

  const destinationName = destination.name ?? "this destination";
  const shareText = `Check out ${destinationName}${destination.country ? `, ${destination.country}` : ""} on Rough Idea Travel`;

  const whatsappUrl = fullUrl
    ? `https://wa.me/?text=${encodeURIComponent(shareText + " " + fullUrl)}`
    : null;
  const emailUrl = fullUrl
    ? `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareText + "\n\n" + fullUrl)}`
    : null;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} />
      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full pointer-events-auto relative">
          {/* Header */}
          <div className="p-5 pb-4 border-b border-border">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <h2 className="font-display font-semibold text-lg">Share this destination</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Share {destinationName} with friends
            </p>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-destructive">{error}</p>
                <button
                  onClick={handleRetry}
                  className="text-sm text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                {/* Copy link */}
                <button
                  onClick={handleCopyLink}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    copied
                      ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      copied ? "bg-green-100 dark:bg-green-900" : "bg-muted"
                    )}
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Link2 className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {copied ? "Link copied!" : "Copy link"}
                    </p>
                    {fullUrl && (
                      <p className="text-xs text-muted-foreground truncate">{fullUrl}</p>
                    )}
                  </div>
                </button>

                {/* Native share (mobile) */}
                {hasNativeShare && (
                  <button
                    onClick={handleNativeShare}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Share via...</p>
                      <p className="text-xs text-muted-foreground">Open system share menu</p>
                    </div>
                  </button>
                )}

                {/* Social links */}
                <div className="flex gap-2 pt-1">
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  )}
                  {emailUrl && (
                    <a
                      href={emailUrl}
                      className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
