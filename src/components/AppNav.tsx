import Link from "next/link";
import { SCREENS } from "@/lib/screens";

export function AppNav() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-950">
            MTR Insight
          </Link>
          <p className="hidden text-xs text-zinc-500 sm:block">
            Prototipo base · datos locales · sin PostgreSQL
          </p>
        </div>
        <nav aria-label="Pantallas del SIG" className="flex flex-wrap gap-1">
          {SCREENS.map((screen) => (
            <Link
              key={screen.href}
              href={screen.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              {screen.code}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
