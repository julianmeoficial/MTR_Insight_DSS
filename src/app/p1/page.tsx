import Link from "next/link";
import { getScreen } from "@/lib/screens";

export default function P1Page() {
  const screen = getScreen("P1")!;
  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10 sm:px-6">
      <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
        {screen.code} · Shell
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">{screen.title}</h1>
      <p className="text-lg text-zinc-600">{screen.purpose}</p>
      <p className="text-sm text-zinc-600">
        Las tarjetas K1–K5 se cablearán en una iteración posterior. Mientras
        tanto, revise el{" "}
        <Link href="/alertas" className="font-medium underline underline-offset-2">
          centro de alertas
        </Link>
        .
      </p>
    </main>
  );
}
