"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { LogOut, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencySelector } from "@/components/CurrencySelector";

export function UserButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (status === "loading") {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-3">
        <CurrencySelector />
        <a
          href="/auth/signin"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          <User className="h-4 w-4" />
          Sign in
        </a>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className="flex items-center gap-3">
      <CurrencySelector />
      <a
        href="/favorites"
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors"
      >
        <Heart className="h-4 w-4" />
        My Favorites
      </a>
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
        >
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? "User"}
              className="h-8 w-8 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            <div className="py-1">
              <a
                href="/favorites"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                )}
              >
                <Heart className="h-4 w-4" />
                My Favorites
              </a>
              <button
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
