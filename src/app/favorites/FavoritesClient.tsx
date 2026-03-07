"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { Heart, Compass, Plus, ChevronDown, Pencil, Trash2, MoreHorizontal, FolderInput } from "lucide-react";
import Link from "next/link";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { slugify, storeDestinationContext } from "@/lib/destination-url";
import { destinationImageUrl } from "@/lib/destination-url";
import { DestinationImage } from "@/components/results/DestinationImage";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { UserButton } from "@/components/auth/UserButton";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/layout/Footer";

interface FavoriteRow {
  id: string;
  destinationName: string;
  country: string;
  destinationData: unknown;
  listId: string | null;
  createdAt: Date;
}

interface WishlistWithPreview {
  id: string;
  name: string;
  shareId: string;
  itemCount: number;
  coverDestinations: { destinationName: string; country: string }[];
  createdAt: Date;
  updatedAt: Date;
}

interface FavoritesClientProps {
  initialWishlists: WishlistWithPreview[];
  initialUncategorized: FavoriteRow[];
}

export function FavoritesClient({
  initialWishlists,
  initialUncategorized,
}: FavoritesClientProps) {
  const [wishlists, setWishlists] = useState(initialWishlists);
  const [uncategorized, setUncategorized] = useState(initialUncategorized);
  const [showUncategorized, setShowUncategorized] = useState(true);
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  // New state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [movePickerFavId, setMovePickerFavId] = useState<string | null>(null);
  const [removeConfirmFavId, setRemoveConfirmFavId] = useState<string | null>(null);

  function handleRemoveUncategorized(favId: string) {
    setUncategorized((prev) => prev.filter((f) => f.id !== favId));
  }

  async function handleCreateList() {
    if (!newListName.trim()) return;

    try {
      const res = await fetch("/api/wishlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create list");
      const created = await res.json();
      setWishlists((prev) => [created, ...prev]);
      setNewListName("");
      setCreatingList(false);
    } catch {
      // fail silently
    }
  }

  function openInNewTab(fav: FavoriteRow) {
    const dest = fav.destinationData as DeepPartial<DestinationSuggestion>;
    const firstStop = dest?.itinerary?.days?.[0]?.location;
    const slug = slugify(fav.destinationName);
    storeDestinationContext(slug, {
      summary: { name: fav.destinationName, country: fav.country },
      detail: dest,
      imageSearchName: firstStop ?? fav.destinationName,
      stableCountry: fav.country,
    });
    window.open(`/destination/${slug}`, "_blank");
  }

  async function handleDeleteWishlist(id: string) {
    try {
      const res = await fetch(`/api/wishlists/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setWishlists((prev) => prev.filter((wl) => wl.id !== id));
    } catch {
      // fail silently
    } finally {
      setConfirmDeleteId(null);
    }
  }

  async function handleMoveToList(favId: string, listId: string) {
    try {
      const res = await fetch(`/api/favorites/${favId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId }),
      });
      if (!res.ok) throw new Error("Failed to move");
      setUncategorized((prev) => prev.filter((f) => f.id !== favId));
    } catch {
      // fail silently
    } finally {
      setMovePickerFavId(null);
      setOpenMenuId(null);
    }
  }

  async function handleRemoveFromSaved(favId: string) {
    try {
      const res = await fetch(`/api/favorites/${favId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
    } catch {
      // fail silently — still remove locally
    } finally {
      handleRemoveUncategorized(favId);
      setOpenMenuId(null);
      setRemoveConfirmFavId(null);
    }
  }

  useEffect(() => {
    if (!openMenuId) return;
    function handleOutside() {
      setOpenMenuId(null);
      setMovePickerFavId(null);
      setRemoveConfirmFavId(null);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [openMenuId]);

  const CLASH: CSSProperties = { fontFamily: "'Clash Display', system-ui, sans-serif" };
  const totalSaved = wishlists.reduce((sum, wl) => sum + wl.itemCount, 0) + uncategorized.length;
  const isEmpty = wishlists.length === 0 && uncategorized.length === 0;

  return (
    <div className="favorites-page min-h-screen" style={{ background: "#0F0E0D" }}>
      {/* Nav */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(28, 26, 23, 0.88)", backdropFilter: "blur(16px)", borderBottom: "1px solid #2E2B25" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ ...CLASH, fontSize: 24, fontWeight: 700, color: "#F2EEE8", textDecoration: "none", letterSpacing: "-0.02em" }}>
            ROUGH IDEA<span style={{ color: "#E8833A" }}>.</span>
          </a>
          <UserButton />
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 40px" }}>

        {/* Page header */}
        <div className="wishlist-header">
          <div className="wishlist-header__left">
            <Heart size={22} style={{ color: "#E8833A", fill: "#E8833A" }} />
            <h1 style={{ ...CLASH, fontSize: 28, fontWeight: 500, color: "#F2EEE8", margin: 0 }}>
              My Wishlists
            </h1>
            <span className="wishlist-header__count">{totalSaved} saved</span>
          </div>
          <button
            className="wishlist-header__new-btn"
            onClick={() => setCreatingList(true)}
          >
            <Plus size={14} />
            New list
          </button>
        </div>

        {isEmpty ? (
          <div className="wishlist-empty">
            <Heart size={48} style={{ color: "#2E2B25", margin: "0 auto", display: "block" }} />
            <h2 className="wishlist-empty__title">No saved destinations yet</h2>
            <p className="wishlist-empty__subtitle">
              Explore destinations and click the heart icon to save your favorites.
            </p>
            <a
              href="/explore"
              className="btn-primary-lg"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}
            >
              <Compass size={16} />
              Explore Destinations
            </a>
          </div>
        ) : (
          <div>

            {/* Wishlist grid */}
            <div className="wishlist-grid">
              {wishlists.map((wl) => {
                if (confirmDeleteId === wl.id) {
                  return (
                    <div key={wl.id} className="wishlist-card-confirm">
                      <p className="wishlist-card-confirm__text">
                        Delete{" "}
                        <span className="wishlist-card-confirm__name">&ldquo;{wl.name}&rdquo;</span>
                        ?
                      </p>
                      <div className="wishlist-card-confirm__actions">
                        <button
                          className="wishlist-card-confirm__cancel"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="wishlist-card-confirm__delete"
                          onClick={() => handleDeleteWishlist(wl.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={wl.id} style={{ position: "relative" }}>
                    <Link href={`/favorites/${wl.id}`} className="wishlist-list-card">
                      {wl.coverDestinations[0] ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={destinationImageUrl(
                            wl.coverDestinations[0].destinationName,
                            wl.coverDestinations[0].country,
                          )}
                          alt=""
                          className="wishlist-list-card__image"
                        />
                      ) : (
                        <div className="wishlist-list-card__empty">
                          <Compass size={28} />
                        </div>
                      )}
                      <div className="wishlist-list-card__overlay" />
                      <div className="wishlist-list-card__content">
                        <span className="wishlist-list-card__name">{wl.name}</span>
                        <span className="wishlist-list-card__count">
                          {wl.itemCount === 0
                            ? "No destinations yet"
                            : `${wl.itemCount} ${wl.itemCount === 1 ? "destination" : "destinations"}`}
                        </span>
                      </div>
                    </Link>

                    {/* Hover actions sit above the Link */}
                    <div className="wishlist-list-card__actions">
                      <Link
                        href={`/favorites/${wl.id}`}
                        className="card-action-btn card-action-btn--edit"
                        title="Edit list"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        className="card-action-btn card-action-btn--delete"
                        title="Delete list"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConfirmDeleteId(wl.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Create new list card */}
              {creatingList ? (
                <div className="wishlist-create-input-card">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateList();
                      if (e.key === "Escape") { setCreatingList(false); setNewListName(""); }
                    }}
                    placeholder="e.g. Spring Trip 2026"
                    autoFocus
                  />
                  <div className="wishlist-create-input-card__actions">
                    <button
                      onClick={handleCreateList}
                      disabled={!newListName.trim()}
                      className="save-modal__btn-save"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => { setCreatingList(false); setNewListName(""); }}
                      className="save-modal__btn-cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button className="wishlist-create-card" onClick={() => setCreatingList(true)}>
                  <Plus size={24} className="wishlist-create-card__icon" />
                  <span className="wishlist-create-card__label">Create new list</span>
                </button>
              )}
            </div>

            {/* Unsorted favorites */}
            {uncategorized.length > 0 && (
              <div className="unsorted-section">
                <button
                  className="unsorted-header"
                  onClick={() => setShowUncategorized(!showUncategorized)}
                >
                  <ChevronDown
                    size={16}
                    className={cn(
                      "unsorted-header__chevron",
                      !showUncategorized && "unsorted-header__chevron--collapsed"
                    )}
                  />
                  <span className="unsorted-header__label">Unsorted favorites</span>
                  <span className="unsorted-header__count">({uncategorized.length})</span>
                </button>

                {showUncategorized && (
                  <div className="unsorted-row">
                    {uncategorized.map((fav) => {
                      const dest = fav.destinationData as DeepPartial<DestinationSuggestion>;
                      const firstStop = dest?.itinerary?.days?.[0]?.location;
                      const isMenuOpen = openMenuId === fav.id;
                      const isMovePicker = movePickerFavId === fav.id;
                      const isRemoveConfirm = removeConfirmFavId === fav.id;

                      return (
                        <div
                          key={fav.id}
                          className="unsorted-card"
                          onClick={() => openInNewTab(fav)}
                        >
                          {/* Image area */}
                          <div className="unsorted-card__image-wrap">
                            <DestinationImage
                              name={fav.destinationName}
                              country={fav.country}
                              searchName={firstStop}
                              fallbackName={firstStop}
                              className="unsorted-card__image"
                            />
                            <div className="unsorted-card__heart">
                              <FavoriteButton
                                destination={dest}
                                isFavorited={true}
                                favoriteId={fav.id}
                                onToggle={(newId) => {
                                  if (!newId) handleRemoveUncategorized(fav.id);
                                }}
                                size="sm"
                              />
                            </div>
                          </div>

                          {/* Card body */}
                          <div className="unsorted-card__body" onClick={(e) => e.stopPropagation()}>
                            <div className="unsorted-card__body-text">
                              <div className="unsorted-card__name">{fav.destinationName}</div>
                              <div className="unsorted-card__meta">{fav.country}</div>
                              <div className="unsorted-card__date">
                                Saved{" "}
                                {new Date(fav.createdAt).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            </div>

                            {/* Ellipsis menu */}
                            <div style={{ position: "relative" }}>
                              <button
                                className="unsorted-card__menu-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(isMenuOpen ? null : fav.id);
                                  setMovePickerFavId(null);
                                  setRemoveConfirmFavId(null);
                                }}
                                title="More options"
                              >
                                <MoreHorizontal size={14} />
                              </button>

                              {isMenuOpen && (
                                <div className="unsorted-card__dropdown" onClick={(e) => e.stopPropagation()}>
                                  {!isMovePicker && !isRemoveConfirm && (
                                    <>
                                      <button
                                        className="unsorted-card__dropdown-item"
                                        onClick={() => setMovePickerFavId(fav.id)}
                                      >
                                        <FolderInput size={13} />
                                        Move to list
                                      </button>
                                      <button
                                        className="unsorted-card__dropdown-item unsorted-card__dropdown-item--danger"
                                        onClick={() => setRemoveConfirmFavId(fav.id)}
                                      >
                                        <Trash2 size={13} />
                                        Remove from saved
                                      </button>
                                    </>
                                  )}

                                  {isMovePicker && (
                                    <div className="unsorted-card__list-picker">
                                      {wishlists.map((wl) => (
                                        <button
                                          key={wl.id}
                                          className="unsorted-card__list-picker-item"
                                          onClick={() => handleMoveToList(fav.id, wl.id)}
                                        >
                                          {wl.name}
                                        </button>
                                      ))}
                                      {wishlists.length === 0 && (
                                        <span style={{ padding: "8px 10px", display: "block", fontSize: 12, color: "#6B6258", fontFamily: "DM Sans, sans-serif" }}>
                                          No lists yet
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {isRemoveConfirm && (
                                    <div style={{ padding: "8px 10px" }}>
                                      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#A89F94", margin: "0 0 10px" }}>
                                        Remove from saved?
                                      </p>
                                      <button
                                        className="unsorted-card__dropdown-item unsorted-card__dropdown-item--danger"
                                        style={{ width: "100%", justifyContent: "center" }}
                                        onClick={() => handleRemoveFromSaved(fav.id)}
                                      >
                                        Yes, remove
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>

      <Footer />

    </div>
  );
}
