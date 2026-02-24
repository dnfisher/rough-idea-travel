"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Plus, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DestinationImage } from "@/components/results/DestinationImage";

interface WishlistSummary {
  id: string;
  name: string;
  itemCount: number;
  coverDestinations: { destinationName: string; country: string }[];
}

interface SaveToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (listId: string | null) => void;
  destinationName: string;
}

export function SaveToListModal({
  isOpen,
  onClose,
  onSave,
  destinationName,
}: SaveToListModalProps) {
  const [wishlists, setWishlists] = useState<WishlistSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newListName, setNewListName] = useState("");
  const createInputRef = useRef<HTMLInputElement>(null);

  // Fetch wishlists when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/wishlists")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setWishlists(data))
      .catch(() => setWishlists([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Focus create input when shown
  useEffect(() => {
    if (showCreateInput) {
      createInputRef.current?.focus();
    }
  }, [showCreateInput]);

  // Escape key handler
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

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setShowCreateInput(false);
      setNewListName("");
    }
  }, [isOpen]);

  async function handleCreateList() {
    if (!newListName.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/wishlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim() }),
      });

      if (!res.ok) throw new Error("Failed to create list");
      const created = await res.json();

      // Save to the newly created list
      onSave(created.id);
    } catch {
      // Fall back to saving without a list
      onSave(null);
    } finally {
      setSaving(false);
    }
  }

  function handleSelectList(listId: string) {
    onSave(listId);
  }

  function handleQuickSave() {
    onSave(null);
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full pointer-events-auto relative max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-border flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <h2 className="font-display font-semibold text-lg">Save to list</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Save {destinationName} to a wishlist
            </p>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Quick save (no list) */}
                <button
                  onClick={handleQuickSave}
                  disabled={saving}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Quick save</p>
                    <p className="text-xs text-muted-foreground">Save without adding to a list</p>
                  </div>
                </button>

                {/* Existing wishlists */}
                {wishlists.map((wl) => (
                  <button
                    key={wl.id}
                    onClick={() => handleSelectList(wl.id)}
                    disabled={saving}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {wl.coverDestinations[0] ? (
                        <DestinationImage
                          name={wl.coverDestinations[0].destinationName}
                          country={wl.coverDestinations[0].country}
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{wl.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {wl.itemCount} {wl.itemCount === 1 ? "destination" : "destinations"}
                      </p>
                    </div>
                  </button>
                ))}

                {/* Create new list */}
                {showCreateInput ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-primary/30 bg-primary/5">
                    <input
                      ref={createInputRef}
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateList();
                      }}
                      placeholder="e.g. Spring Trip 2026"
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      disabled={saving}
                    />
                    <button
                      onClick={handleCreateList}
                      disabled={saving || !newListName.trim()}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        newListName.trim()
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Create"
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCreateInput(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Create new list</p>
                      <p className="text-xs text-muted-foreground">Organize your travel ideas</p>
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
