# TripInputForm Redesign — Design Document

**Date:** 2026-03-04
**Status:** Approved

---

## Background

The existing `TripInputForm` (4-card multi-step) had several issues identified in a LukeW form audit:

- Ghost "Search now" button on non-final cards competed with "Next", confusing the path to completion
- `travelers` hardcoded to `1` — group travel never collected
- Location preference buried on the last card (Card 4) where users might drop off
- Card 2 (When) sparse — one question on its own step
- Card 4 bundled three unrelated concerns: weather, budget, location
- No form validation — empty submissions possible
- `additionalNotes` in schema but never surfaced in UI
- Confirm-button pattern for flexible dates / region non-obvious
- Date inputs side-by-side cramped on mobile
- CTA label "Search" too generic

---

## Step Structure

3 steps replacing the current 4, with weather redistributed to prevent Step 3 height bloat:

| Step | Label | Fields |
|------|-------|--------|
| 1 | Where & Who | Home city · Travel range · Location preference · Group type |
| 2 | When & Weather | Date type · Date inputs or flexible description · Duration · Weather preference |
| 3 | Vibe & Budget | Interests · Trip style · Budget · Additional notes (optional) |

Progress bar remains as clickable segments. Step label updates to reflect new names.

---

## New & Changed Fields

### Group type (new — Step 1)
Replaces hardcoded `travelers: 1`. Four chips, no default (user must choose):

- Solo
- Couple
- Small group (3–5)
- Large group (6+)

Maps to a `travelers` semantic value passed to the AI. The Zod schema `travelers` field changes from `z.number().min(1).default(1)` to an enum or descriptive string — AI prompt handles interpretation.

### Location preference (moved Step 4 → Step 1)
Sits below Travel range. No logic changes — just repositioned. Two pills: `Surprise me` / `Region`. Region reveals text input with `onBlur` confirmation replacing the current explicit confirm-button pattern.

### Weather preference (moved Step 4 → Step 2)
Sits below Duration. Five chips unchanged: Warm & Sunny · Mild & Pleasant · Hot · Cool & Crisp · Don't Mind.

### Additional notes (new — Step 3, optional)
Small textarea, clearly marked optional. Below the label, inline example hints in muted text:

> "celebrating an anniversary" · "need wheelchair access" · "my partner hates flying" · "travelling with a toddler"

Maps to existing `additionalNotes` field in `TripInputSchema`.

---

## Fixes Applied

| Issue | Resolution |
|-------|------------|
| Ghost "Search now" on Steps 1–2 | Removed — Next is sole forward action |
| `travelers` hardcoded to 1 | Replaced with Group type chip selector |
| No validation | `homeCity` validates on blur; inline error if empty when advancing past Step 1; `endDate >= startDate` validated on end-date blur |
| Location buried on Card 4 | Moved to Step 1 |
| Confirm button pattern non-obvious | Replaced with `onBlur` confirmation; hint text "Press Enter or tab to confirm" beneath flexible date / region inputs |
| Date inputs cramped on mobile | Stacked vertically on small screens |
| CTA label generic | Renamed to "Find my trip" |
| Progress bar tap targets too small | Height increased, invisible tap padding added |
| `additionalNotes` never surfaced | Optional textarea with examples, Step 3 |

---

## Summary / Edit Mode

Post-submit summary pill row unchanged in pattern — clickable pills jump to the relevant step. Changes:

- Pills now map to 3 steps instead of 4
- New `Group type` pill added (e.g. "Couple")
- "Search again" button renamed to "Find my trip"

---

## Out of Scope

- `locationPreference.type === "specific"` variant (exists in schema/state, no UI — remains hidden)
- `comparePlaces` field in schema — not surfaced
- Any backend / API / schema changes beyond `travelers` field semantics

---

## Constraints

- Mobile-first — no step card should require significant vertical scrolling on a 375px viewport
- Keep it local (feature branch) until visually verified; do not merge to main before review
- Preserve existing summary pill pattern exactly
- No new dependencies
