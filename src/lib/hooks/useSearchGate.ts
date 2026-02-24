"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";

const STORAGE_KEY = "ri_search_count";
const MAX_FREE_SEARCHES = 3;

function getSearchCount(): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

function incrementSearchCount(): number {
  const next = getSearchCount() + 1;
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
}

export function useSearchGate() {
  const { data: session } = useSession();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signInReason, setSignInReason] = useState<"search_limit" | "favorite">(
    "search_limit"
  );

  const checkSearchAllowed = useCallback((): boolean => {
    if (session?.user) return true;

    const count = incrementSearchCount();
    if (count > MAX_FREE_SEARCHES) {
      setSignInReason("search_limit");
      setShowSignInModal(true);
      return false;
    }
    return true;
  }, [session]);

  const checkFavoriteAllowed = useCallback((): boolean => {
    if (session?.user) return true;
    setSignInReason("favorite");
    setShowSignInModal(true);
    return false;
  }, [session]);

  const closeModal = useCallback(() => {
    setShowSignInModal(false);
  }, []);

  return {
    showSignInModal,
    signInReason,
    checkSearchAllowed,
    checkFavoriteAllowed,
    closeModal,
  };
}
