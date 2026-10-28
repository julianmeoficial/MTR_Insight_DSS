import { Archivo, B612_Mono, IBM_Plex_Sans } from "next/font/google";

/** Display: width axis condensed for terminal signage, wide for the landing. */
export const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

/** Text and interface. */
export const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-plex",
  display: "swap",
});

/** KPIs, codes (MTR, PTY, ERJ-145) and dates: Airbus cockpit-display face. */
export const mono = B612_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-b612",
  display: "swap",
});
