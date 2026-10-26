"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountUser } from "@handoff/contracts";

export default function SiteHeader({ user }: { user: AccountUser | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Handoff-CSRF": "1" },
        body: "{}",
      });
      if (!response.ok) throw new Error("Logout failed");
      router.replace("/");
      router.refresh();
    } catch {
      setError("Could not log out. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5"
      >
        <Link
          href={user ? "/vehicles" : "/"}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-white text-sm font-bold text-black">
            H
          </span>
          HandOff
        </Link>
        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link
                href="/bookings"
                className="rounded-full px-2 py-2 text-white/90 hover:bg-white/10"
              >
                Bookings
              </Link>
              <Link
                href="/account"
                className="rounded-full px-3 py-2 text-white/90 hover:bg-white/10"
              >
                Account
              </Link>
              <button
                type="button"
                onClick={logout}
                disabled={pending}
                className="rounded-full bg-white px-4 py-2 font-semibold text-black disabled:opacity-50"
              >
                {pending ? "Logging out…" : "Log out"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="rounded-full px-3 py-2 font-medium text-white/90 hover:bg-white/10"
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-white px-4 py-2 font-semibold text-black"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
      {error && (
        <p
          role="alert"
          className="mx-auto max-w-7xl px-6 text-right text-sm text-red-400"
        >
          {error}
        </p>
      )}
    </header>
  );
}
