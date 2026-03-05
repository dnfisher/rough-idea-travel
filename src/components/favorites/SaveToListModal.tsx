"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DestinationImage } from "@/components/results/DestinationImage";

const QUICK_SAVE = "quick" as const;

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
const [selectedListId, setSelectedListId] = useState<string | null>(null);
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
      setSelectedListId(null);
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
      <div className="save-modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="save-modal-wrap">
        <div className="save-modal">

          {/* Header */}
          <div className="save-modal__header">
            <h2 className="save-modal__title">
              Save{" "}
              <span className="save-modal__title-dest">{destinationName}</span>{" "}
              to a wishlist
            </h2>
            <button className="save-modal__close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>

          {/* List */}
          <div className="save-modal__list">
            {loading ? (
              <div className="save-modal__loading">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#6B6258" }} />
              </div>
            ) : (
              <>
                {/* Save without list */}
                <button
                  className={cn(
                    "save-modal__item save-modal__item--no-list",
                    selectedListId === QUICK_SAVE && "save-modal__item--selected"
                  )}
                  onClick={() => setSelectedListId(QUICK_SAVE)}
                  disabled={saving}
                >
                  <div className="save-modal__thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={18} style={{ color: "#6B6258" }} />
                  </div>
                  <div className="save-modal__item-text">
                    <span className="save-modal__item-name">Save without adding to a list</span>
                  </div>
                  {selectedListId === QUICK_SAVE && (
                    <div className="save-modal__check">
                      <Check size={10} />
                    </div>
                  )}
                </button>

                {/* Existing wishlists */}
                {wishlists.map((wl) => (
                  <button
                    key={wl.id}
                    className={cn(
                      "save-modal__item",
                      selectedListId === wl.id && "save-modal__item--selected"
                    )}
                    onClick={() => setSelectedListId(wl.id)}
                    disabled={saving}
                  >
                    <div className="save-modal__thumb">
                      {wl.coverDestinations[0] ? (
                        <DestinationImage
                          name={wl.coverDestinations[0].destinationName}
                          country={wl.coverDestinations[0].country}
                          className="w-full h-full"
                        />
                      ) : null}
                    </div>
                    <div className="save-modal__item-text">
                      <span className="save-modal__item-name">{wl.name}</span>
                      <span className="save-modal__item-count">
                        {wl.itemCount} {wl.itemCount === 1 ? "destination" : "destinations"}
                      </span>
                    </div>
                    {selectedListId === wl.id && (
                      <div className="save-modal__check">
                        <Check size={10} />
                      </div>
                    )}
                  </button>
                ))}

                {/* Create new list */}
                {showCreateInput ? (
                  <div className="save-modal__item save-modal__item--create" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                    <input
                      ref={createInputRef}
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleCreateList(); }}
                      placeholder="e.g. Spring Trip 2026"
                      disabled={saving}
                      style={{
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid #2E2B25",
                        paddingBottom: 8,
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 14,
                        color: "#F2EEE8",
                        outline: "none",
                      }}
                    />
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button
                        className="save-modal__btn-cancel"
                        onClick={() => setShowCreateInput(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="save-modal__btn-save"
                        onClick={handleCreateList}
                        disabled={saving || !newListName.trim()}
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="save-modal__item save-modal__item--create"
                    onClick={() => setShowCreateInput(true)}
                  >
                    <div className="save-modal__thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(42,191,191,0.08)" }}>
                      <Plus size={18} style={{ color: "#2ABFBF" }} />
                    </div>
                    <div className="save-modal__item-text">
                      <span className="save-modal__item-name">Create new list</span>
                      <span className="save-modal__item-sub">Organise your travel ideas</span>
                    </div>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="save-modal__footer">
            <button className="save-modal__btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="save-modal__btn-save"
              disabled={saving || selectedListId === null}
              onClick={() => {
                if (saving || !selectedListId) return;
                setSaving(true);
                if (selectedListId === QUICK_SAVE) handleQuickSave();
                else handleSelectList(selectedListId);
              }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save to wishlist"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
