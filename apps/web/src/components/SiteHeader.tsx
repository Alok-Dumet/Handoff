"use client";

import Link from "next/link";
import Image from "next/image"
import { useAuth, UserButton } from "@clerk/nextjs";

export default function SiteHeader() {
  const { isSignedIn } = useAuth();
  // Signed-in users land on their vehicles; everyone else goes home.
  const logoHref = isSignedIn ? "/vehicles" : "/";

  return (
    <header className="absolute inset-x-0 top-0 z-20 border-b border-red">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href={logoHref}
          className="flex cursor-pointer items-center gap-2 text-lg font-semibold tracking-tight text-white"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-white text-sm font-bold text-black">
            H
          </span>
          HandOff
        </Link>

        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <div className="group relative h-8 w-8 rounded-full transition duration-300 hover:shadow-[0_0_12px_4px_rgba(255,255,255,0.7)]">
              <div className="absolute inset-0 opacity-0" id="buttonWrapper">
                <UserButton />
              </div>

              <Image
                src="/Icon.png"
                alt="User Profile"
                fill
                className="pointer-events-none rounded-full object-cover"
                id="image"
              />
            </div>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="rounded-full px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-white/90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
