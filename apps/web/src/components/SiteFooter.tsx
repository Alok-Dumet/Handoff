import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black text-white/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="grid h-6 w-6 place-items-center rounded bg-white text-xs font-bold text-black">
            H
          </span>
          HandOff
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <Link href="/" className="transition-colors hover:text-white">
            About
          </Link>
          <Link href="/vehicles" className="transition-colors hover:text-white">
            Vehicles
          </Link>
          <Link href="/" className="transition-colors hover:text-white">
            Support
          </Link>
          <Link href="/" className="transition-colors hover:text-white">
            Privacy
          </Link>
        </nav>

        <p className="text-xs text-white/40">© 2026 HandOff. All rights reserved.</p>
      </div>
    </footer>
  );
}
