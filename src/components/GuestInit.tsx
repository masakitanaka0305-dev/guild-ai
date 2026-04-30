"use client";

import { useEffect } from "react";

/**
 * Sets the mock-auth localStorage flag once on mount so any downstream
 * isMockAuthed() checks return true for all visitors.
 * Remove when real auth is re-introduced in v2.
 */
export function GuestInit() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("guild_authed", "1");
    }
  }, []);
  return null;
}
