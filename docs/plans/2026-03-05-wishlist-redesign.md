# Wishlist Page & Save Modal Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the favorites/wishlist page and save-to-list modal to match the warm dark design system used across the app, and fix the critical text visibility bug in the modal.

**Architecture:** All visual changes are contained to three files: `globals.css` (new CSS classes), `FavoritesClient.tsx` (page redesign), and `SaveToListModal.tsx` (modal redesign). No API routes, routing, data fetching, or state management logic changes. The `WishlistDetailClient.tsx` is out of scope.

**Tech Stack:** React, Next.js App Router, Tailwind CSS v4, Lucide icons, DM Sans + Clash Display fonts, existing API endpoints at `/api/wishlists` and `/api/favorites/[id]`.

---

## Design Reference

### Color tokens used throughout
```
--color-bg:           #0F0E0D   (--background)
--color-bg-elevated:  #1C1A17   (--card)
--color-bg-subtle:    #252219   (--surface / --muted)
--color-border:       #2E2B25   (--border)
--color-text-primary: #F2EEE8   (--foreground)
--color-text-secondary: #A89F94 (--muted-foreground)
--color-text-muted:   #6B6258   (--dp-text-muted)
--color-teal:         #2ABFBF   (--primary)
--color-orange:       #E8833A   (--highlight / --dp-orange)
```

### Clash Display headings pattern
```tsx
const CLASH: React.CSSProperties = { fontFamily: "'Clash Display', system-ui, sans-serif" };
// Usage: <h1 style={CLASH}>...</h1>
// Do NOT use .font-display CSS class (Tailwind v4 compiles it statically)
```

### Unsorted card ellipsis button decision
- Heart button (`FavoriteButton`) stays top-right of image — handles fave/unfave only (no change)
- Ellipsis (`⋯`) button sits in the card body row, right-aligned at the same height as the destination name
- Clicking `⋯` opens a small dropdown: "Move to list" | "Remove from saved"
- "Remove from saved" shows inline confirmation (no modal)
- "Move to list" shows a list-picker popover using the existing wishlists state

---

## Task 1: Add `.favorites-page` dark theme + all new CSS classes to globals.css

**Files:**
- Modify: `src/app/globals.css`

This task adds all the CSS for both the page and modal. No React changes yet.

**Step 1: Add `.favorites-page` to the dark theme selector**

Find the existing selector block at line ~261:
```css
.destination-page,
.explore-page,
.homepage {
```

Change it to:
```css
.destination-page,
.explore-page,
.homepage,
.favorites-page {
```

**Step 2: Add Clash Display font override for favorites page**

After the existing `.destination-page .font-display` rule (~line 289), add:
```css
.favorites-page .font-display,
.favorites-page [data-clash] {
  font-family: 'Clash Display', system-ui, sans-serif;
}
```

**Step 3: Append wishlist page CSS block**

Add the following at the end of globals.css (after the footer section):

```css
/* ── Wishlist / Favorites Page ───────────────────────────── */
.wishlist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;
}

.wishlist-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wishlist-header__count {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #6B6258;
  background: #252219;
  border: 1px solid #2E2B25;
  border-radius: 999px;
  padding: 3px 10px;
  margin-left: 2px;
}

.wishlist-header__new-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #2E2B25;
  border-radius: 10px;
  padding: 10px 18px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #F2EEE8;
  background: transparent;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.wishlist-header__new-btn:hover {
  border-color: #2ABFBF;
  color: #2ABFBF;
}

/* Wishlist list card grid */
.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 48px;
}

@media (max-width: 768px) {
  .wishlist-grid {
    grid-template-columns: 1fr;
  }
}

/* Individual wishlist card */
.wishlist-list-card {
  height: 200px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background: #1C1A17;
  border: 1px solid #2E2B25;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-decoration: none;
  display: block;
}

.wishlist-list-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

.wishlist-list-card__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.wishlist-list-card:hover .wishlist-list-card__image {
  opacity: 0.65;
}

.wishlist-list-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(15, 14, 13, 0.95) 0%, rgba(15, 14, 13, 0.3) 100%);
}

.wishlist-list-card__content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
}

.wishlist-list-card__name {
  font-family: 'Clash Display', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 500;
  color: #F2EEE8;
  display: block;
}

.wishlist-list-card__count {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #6B6258;
  margin-top: 4px;
  display: block;
}

/* Hover action buttons (edit/delete) */
.wishlist-list-card__actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.wishlist-list-card:hover .wishlist-list-card__actions {
  opacity: 1;
}

.card-action-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(15, 14, 13, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  color: #A89F94;
}

.card-action-btn--edit:hover {
  background: rgba(42, 191, 191, 0.3);
  border-color: #2ABFBF;
}

.card-action-btn--delete:hover {
  background: rgba(232, 131, 58, 0.3);
  border-color: #E8833A;
}

/* Inline delete confirmation state */
.wishlist-card-confirm {
  height: 200px;
  border-radius: 16px;
  background: #1C1A17;
  border: 1px solid #E8833A;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
}

.wishlist-card-confirm__text {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #F2EEE8;
  text-align: center;
}

.wishlist-card-confirm__name {
  color: #E8833A;
}

.wishlist-card-confirm__actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.wishlist-card-confirm__cancel {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: #6B6258;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px 12px;
  transition: color 0.15s ease;
}

.wishlist-card-confirm__cancel:hover {
  color: #A89F94;
}

.wishlist-card-confirm__delete {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #E8833A;
  background: rgba(232, 131, 58, 0.12);
  border: 1px solid rgba(232, 131, 58, 0.3);
  border-radius: 8px;
  cursor: pointer;
  padding: 6px 14px;
  transition: background 0.15s ease;
}

.wishlist-card-confirm__delete:hover {
  background: rgba(232, 131, 58, 0.22);
}

/* Create new list card */
.wishlist-create-card {
  height: 200px;
  border-radius: 16px;
  border: 2px dashed #2E2B25;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.wishlist-create-card:hover {
  border-color: #2ABFBF;
  background: rgba(42, 191, 191, 0.04);
}

.wishlist-create-card__icon {
  color: #6B6258;
  transition: color 0.2s ease;
}

.wishlist-create-card:hover .wishlist-create-card__icon {
  color: #2ABFBF;
}

.wishlist-create-card__label {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #6B6258;
  transition: color 0.2s ease;
}

.wishlist-create-card:hover .wishlist-create-card__label {
  color: #2ABFBF;
}

/* Create-in-progress state (name input inside the card slot) */
.wishlist-create-input-card {
  height: 200px;
  border-radius: 16px;
  background: #1C1A17;
  border: 1px solid rgba(42, 191, 191, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
}

.wishlist-create-input-card input {
  width: 100%;
  text-align: center;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(42, 191, 191, 0.4);
  padding-bottom: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: #F2EEE8;
  outline: none;
}

.wishlist-create-input-card input::placeholder {
  color: #6B6258;
}

.wishlist-create-input-card__actions {
  display: flex;
  gap: 8px;
}

/* ── Unsorted Favorites Section ──────────────────────────── */
.unsorted-section {
  margin-top: 8px;
}

.unsorted-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}

.unsorted-header__chevron {
  color: #6B6258;
  transition: transform 0.2s ease;
}

.unsorted-header__chevron--collapsed {
  transform: rotate(-90deg);
}

.unsorted-header__label {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #F2EEE8;
}

.unsorted-header__count {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: #6B6258;
}

/* Unsorted item card — horizontal scroll row */
.unsorted-row {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
}

.unsorted-row::-webkit-scrollbar {
  display: none;
}

.unsorted-card {
  width: 280px;
  flex-shrink: 0;
  border-radius: 14px;
  overflow: visible;
  background: #1C1A17;
  border: 1px solid #2E2B25;
  position: relative;
  transition: transform 0.2s ease;
}

.unsorted-card:hover {
  transform: translateY(-2px);
}

.unsorted-card__image-wrap {
  width: 100%;
  height: 160px;
  overflow: hidden;
  border-radius: 14px 14px 0 0;
  position: relative;
}

.unsorted-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.unsorted-card__heart {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.unsorted-card__body {
  padding: 12px 14px 10px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.unsorted-card__body-text {
  flex: 1;
  min-width: 0;
}

.unsorted-card__name {
  font-family: 'Clash Display', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #F2EEE8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unsorted-card__meta {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 400;
  color: #6B6258;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-top: 2px;
}

.unsorted-card__date {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 400;
  color: #6B6258;
  margin-top: 4px;
}

/* Ellipsis button */
.unsorted-card__menu-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6B6258;
  transition: background 0.15s ease, color 0.15s ease;
  flex-shrink: 0;
  margin-top: 1px;
  position: relative;
}

.unsorted-card__menu-btn:hover {
  background: #252219;
  color: #A89F94;
}

/* Ellipsis dropdown */
.unsorted-card__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: #1C1A17;
  border: 1px solid #2E2B25;
  border-radius: 10px;
  padding: 6px;
  min-width: 160px;
  z-index: 20;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.unsorted-card__dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: #A89F94;
  cursor: pointer;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  transition: background 0.12s ease, color 0.12s ease;
  white-space: nowrap;
}

.unsorted-card__dropdown-item:hover {
  background: #252219;
  color: #F2EEE8;
}

.unsorted-card__dropdown-item--danger:hover {
  color: #E8833A;
}

/* Inline remove confirm (shown below the card body) */
.unsorted-card__remove-confirm {
  padding: 0 14px 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: #A89F94;
  display: flex;
  align-items: center;
  gap: 10px;
}

.unsorted-card__remove-confirm-yes {
  color: #E8833A;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  padding: 0;
  transition: opacity 0.15s ease;
}

.unsorted-card__remove-confirm-yes:hover {
  opacity: 0.8;
}

/* Move to list picker (sub-panel in dropdown) */
.unsorted-card__list-picker {
  border-top: 1px solid #2E2B25;
  padding-top: 6px;
  margin-top: 6px;
}

.unsorted-card__list-picker-item {
  display: block;
  padding: 7px 10px;
  border-radius: 6px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: #A89F94;
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  transition: background 0.12s ease, color 0.12s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unsorted-card__list-picker-item:hover {
  background: #252219;
  color: #F2EEE8;
}

.unsorted-card__list-picker-create {
  color: #2ABFBF;
}

.unsorted-card__list-picker-create:hover {
  color: #2ABFBF;
  background: rgba(42, 191, 191, 0.08);
}

/* Empty state */
.wishlist-empty {
  border-radius: 20px;
  border: 1px solid #2E2B25;
  background: #1C1A17;
  padding: 64px 40px;
  text-align: center;
}

.wishlist-empty__title {
  font-family: 'Clash Display', system-ui, sans-serif;
  font-size: 20px;
  font-weight: 500;
  color: #F2EEE8;
  margin: 16px 0 8px;
}

.wishlist-empty__subtitle {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: #6B6258;
  margin-bottom: 24px;
}

/* ── Save To List Modal ───────────────────────────────────── */
.save-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
}

.save-modal-wrap {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  pointer-events: none;
}

.save-modal {
  background: #1C1A17;
  border: 1px solid #2E2B25;
  border-radius: 20px;
  width: 420px;
  max-width: 90vw;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.7);
  overflow: hidden;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.save-modal__header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid #2E2B25;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

.save-modal__title {
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #F2EEE8;
  line-height: 1.4;
  margin: 0;
}

.save-modal__title-dest {
  color: #2ABFBF;
}

.save-modal__close {
  background: none;
  border: none;
  font-size: 20px;
  color: #6B6258;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.15s ease;
  flex-shrink: 0;
}

.save-modal__close:hover {
  color: #F2EEE8;
}

.save-modal__list {
  padding: 8px;
  overflow-y: auto;
  flex: 1;
}

.save-modal__list::-webkit-scrollbar {
  width: 4px;
}

.save-modal__list::-webkit-scrollbar-track {
  background: transparent;
}

.save-modal__list::-webkit-scrollbar-thumb {
  background: #2E2B25;
  border-radius: 999px;
}

.save-modal__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
}

.save-modal__item:hover {
  background: #252219;
}

.save-modal__item--selected {
  background: rgba(42, 191, 191, 0.08);
}

.save-modal__item--no-list {
  border-bottom: 1px solid #2E2B25;
  margin-bottom: 8px;
  padding-bottom: 14px;
  border-radius: 0;
}

.save-modal__item--create {
  border-top: 1px solid #2E2B25;
  margin-top: 8px;
  padding-top: 14px;
  border-radius: 0;
}

.save-modal__thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  background: #252219;
  overflow: hidden;
}

.save-modal__item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

/* CRITICAL: explicitly white — this was the bug (inherited bg color) */
.save-modal__item-name {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #F2EEE8 !important;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.save-modal__item--selected .save-modal__item-name {
  color: #2ABFBF !important;
}

.save-modal__item-count {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #6B6258 !important;
}

.save-modal__item-sub {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #6B6258;
}

.save-modal__item--create .save-modal__item-name {
  color: #2ABFBF !important;
}

.save-modal__check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #2ABFBF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #0F0E0D;
}

.save-modal__footer {
  padding: 14px 20px;
  border-top: 1px solid #2E2B25;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.save-modal__btn-cancel {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #6B6258;
  border: 1px solid #2E2B25;
  border-radius: 8px;
  padding: 10px 18px;
  background: transparent;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.save-modal__btn-cancel:hover {
  color: #A89F94;
  border-color: #A89F94;
}

.save-modal__btn-save {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #0F0E0D;
  background: #2ABFBF;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.save-modal__btn-save:hover {
  background: #24ABAB;
}

.save-modal__btn-save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Loading spinner within modal */
.save-modal__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
```

**Step 4: Verify**

Open the file and confirm:
- `.favorites-page` appears in the dark theme selector
- All class names above are present
- No duplicate selectors

---

## Task 2: Redesign `FavoritesClient.tsx`

**Files:**
- Modify: `src/app/favorites/FavoritesClient.tsx`

Complete rewrite of this component. All data-fetching logic, state, and API calls stay exactly the same. Only the JSX and visual structure changes.

**Step 1: Read and understand the current component**

Re-read `src/app/favorites/FavoritesClient.tsx` (already done above — 317 lines).

Key state to preserve:
- `wishlists`, `uncategorized`, `showUncategorized`, `creatingList`, `newListName`, `copiedShareId`
- `handleRemoveUncategorized`, `handleCreateList`, `handleCopyShareLink`, `openInNewTab`

**Step 2: Add new state for delete confirmation and ellipsis menu**

Add to the existing state declarations:
```tsx
const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
const [openMenuId, setOpenMenuId] = useState<string | null>(null);
const [movePickerFavId, setMovePickerFavId] = useState<string | null>(null);
const [removeConfirmFavId, setRemoveConfirmFavId] = useState<string | null>(null);
```

**Step 3: Add handlers**

Add these handler functions after the existing ones:

```tsx
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
```

**Step 4: Rewrite the JSX**

Replace everything from `return (` to the final `)` with the following. Study this carefully — the outer wrapper adds the `favorites-page` class which activates the dark theme:

```tsx
// At top of component, before return:
const CLASH: React.CSSProperties = { fontFamily: "'Clash Display', system-ui, sans-serif" };
const totalSaved = wishlists.reduce((sum, wl) => sum + wl.itemCount, 0) + uncategorized.length;
const isEmpty = wishlists.length === 0 && uncategorized.length === 0;

return (
  <div className="favorites-page min-h-screen" style={{ background: "#0F0E0D" }}>
    {/* Nav */}
    <header className="homepage-nav" style={{ position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ ...CLASH, fontSize: 22, fontWeight: 600, color: "#F2EEE8", textDecoration: "none", letterSpacing: "-0.02em" }}>
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
                <div key={wl.id} className="wishlist-list-card" style={{ display: "block", position: "relative" }}>
                  <Link href={`/favorites/${wl.id}`} className="wishlist-list-card" style={{ border: "none" }}>
                    {wl.coverDestinations[0] ? (
                      <DestinationImage
                        name={wl.coverDestinations[0].destinationName}
                        country={wl.coverDestinations[0].country}
                        className="wishlist-list-card__image"
                      />
                    ) : null}
                    <div className="wishlist-list-card__overlay" />
                    <div className="wishlist-list-card__content">
                      <span className="wishlist-list-card__name">{wl.name}</span>
                      <span className="wishlist-list-card__count">
                        {wl.itemCount} {wl.itemCount === 1 ? "destination" : "destinations"}
                      </span>
                    </div>
                  </Link>

                  {/* Hover actions — sit on top of the Link */}
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
                                    <div style={{ display: "flex", gap: 8 }}>
                                      <button
                                        className="unsorted-card__dropdown-item unsorted-card__dropdown-item--danger"
                                        style={{ flex: 1, justifyContent: "center" }}
                                        onClick={() => handleRemoveUncategorized(fav.id)}
                                      >
                                        Yes, remove
                                      </button>
                                    </div>
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
  </div>
);
```

**Step 5: Update imports**

The new JSX uses `Pencil`, `Trash2`, `MoreHorizontal`, `FolderInput` from lucide-react. Update the import line:

```tsx
import { Heart, Compass, Plus, ChevronDown, Pencil, Trash2, MoreHorizontal, FolderInput } from "lucide-react";
```

Also remove the now-unused `ChevronUp`, `Share2` imports.

**Step 6: Close dropdown on outside click**

Add a `useEffect` to close the open menu when clicking outside:

```tsx
useEffect(() => {
  if (!openMenuId) return;
  function handleOutside(e: MouseEvent) {
    setOpenMenuId(null);
    setMovePickerFavId(null);
    setRemoveConfirmFavId(null);
  }
  document.addEventListener("mousedown", handleOutside);
  return () => document.removeEventListener("mousedown", handleOutside);
}, [openMenuId]);
```

**Step 7: Verify the component compiles**

Run: `npm run build 2>&1 | head -40`
Expected: no TypeScript errors in `FavoritesClient.tsx`

**Step 8: Commit**

```bash
git add src/app/favorites/FavoritesClient.tsx src/app/globals.css
git commit -m "feat: redesign wishlist page to dark theme with hover actions and ellipsis menu"
```

---

## Task 3: Redesign `SaveToListModal.tsx`

**Files:**
- Modify: `src/components/favorites/SaveToListModal.tsx`

This is primarily a JSX replacement — all state, effects, and handlers remain identical.

**Step 1: Read current file**

Re-read `src/components/favorites/SaveToListModal.tsx` (already done — 243 lines).

Preserve exactly:
- All `useState` and `useRef` declarations
- All `useEffect` hooks (fetch on open, focus, escape, reset)
- `handleCreateList`, `handleSelectList`, `handleQuickSave` functions

**Step 2: Add selected-list state**

The new modal design shows a checkmark on the selected item. Add one piece of state:

```tsx
const [selectedListId, setSelectedListId] = useState<string | null | "quick">(null);
```

Reset it in the existing "reset on close" effect:
```tsx
useEffect(() => {
  if (!isOpen) {
    setShowCreateInput(false);
    setNewListName("");
    setSelectedListId(null);  // add this line
  }
}, [isOpen]);
```

**Step 3: Replace the JSX**

Replace everything from `if (!isOpen) return null;` to the end of the component with:

```tsx
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
                  selectedListId === "quick" && "save-modal__item--selected"
                )}
                onClick={() => setSelectedListId("quick")}
                disabled={saving}
              >
                <div className="save-modal__thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={18} style={{ color: "#6B6258" }} />
                </div>
                <div className="save-modal__item-text">
                  <span className="save-modal__item-name">Save without adding to a list</span>
                </div>
                {selectedListId === "quick" && (
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
              if (selectedListId === "quick") handleQuickSave();
              else if (selectedListId) handleSelectList(selectedListId);
            }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save to wishlist"}
          </button>
        </div>

      </div>
    </div>
  </>
);
```

**Note on flow change:** The new modal uses a two-step UX — user selects a list, then clicks "Save to wishlist". Previously clicking a list immediately saved. This is intentional per the spec (footer Save button). The existing `handleSelectList` and `handleQuickSave` functions are called from the footer button, so they work as-is.

**Step 4: Verify no TypeScript errors**

Run: `npm run build 2>&1 | head -40`
Expected: clean build

**Step 5: Commit**

```bash
git add src/components/favorites/SaveToListModal.tsx
git commit -m "feat: redesign save-to-list modal with dark theme and fix text visibility bug"
```

---

## Task 4: Wire the `favorites-page` class and manual smoke test

**Files:**
- No file changes needed — the `favorites-page` class is already added to the wrapper `<div>` in Task 2.

**Step 1: Run dev server**

```bash
npm run dev
```

**Step 2: Navigate to `/favorites`**

Check:
- [ ] Page background is `#0F0E0D` (near-black)
- [ ] Nav is dark frosted glass style (`.homepage-nav` class)
- [ ] Page header shows heart icon (orange), "My Wishlists" in Clash Display, count badge
- [ ] "New list" button visible top-right
- [ ] Wishlist cards are dark with image, gradient overlay, name/count pinned to bottom
- [ ] Hovering a card lifts it and reveals edit (pencil) + delete (trash) action buttons
- [ ] Edit button navigates to `/favorites/[id]`
- [ ] Delete button shows inline delete confirmation (orange border, "Delete [name]? / Cancel / Delete")
- [ ] Delete confirm → calls DELETE API → card disappears from grid
- [ ] "Create new list" dashed card → click → shows name input inline → Enter creates list
- [ ] Unsorted section shows with chevron toggle
- [ ] Unsorted cards are 280px wide, horizontally scrollable
- [ ] Heart button remains top-right of image (unchanged)
- [ ] Ellipsis (`⋯`) button in card body, right of destination name
- [ ] Clicking `⋯` opens dropdown with "Move to list" and "Remove from saved"
- [ ] "Move to list" shows list names as sub-options; clicking one calls PATCH → card disappears
- [ ] "Remove from saved" shows inline confirm → "Yes, remove" → calls existing `handleRemoveUncategorized` (which triggers FavoriteButton's DELETE via `onToggle`)

**Step 3: Click heart on any unfavorited destination card to test save modal**

Check:
- [ ] Modal backdrop is dark blurred
- [ ] Modal has dark background (`#1C1A17`)
- [ ] Title shows destination name in teal
- [ ] "Save without adding to a list" item visible with explicit white text
- [ ] Existing wishlists show with thumbnails and legible names (THE BUG IS FIXED)
- [ ] Selecting an item shows teal checkmark
- [ ] "Create new list" option at bottom with teal plus icon and "Organise your travel ideas" subtext
- [ ] Footer has Cancel + "Save to wishlist" button
- [ ] Save button disabled until a selection is made
- [ ] Clicking Save calls the correct action

**Step 4: Commit smoke test confirmation**

```bash
git add -p  # nothing to stage if no code changed
git commit -m "feat: wishlist page and save modal full dark redesign complete"
```

---

## What Was NOT Changed (per spec)

- `src/app/favorites/page.tsx` — server component, untouched
- `src/app/favorites/[listId]/WishlistDetailClient.tsx` — out of scope
- `src/app/favorites/[listId]/page.tsx` — out of scope
- All API routes (`/api/wishlists/*`, `/api/favorites/*`)
- `FavoriteButton.tsx` — heart behavior unchanged
- Routing to/from wishlist page
