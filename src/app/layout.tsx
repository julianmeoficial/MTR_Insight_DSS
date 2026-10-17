import type { Metadata } from "next";
import { inter, mono } from "@/app/fonts";
import { PreferencesProvider } from "@/components/providers/PreferencesProvider";
import { LOCALE_COOKIE, THEME_COOKIE } from "@/i18n/cookies";
import "./globals.css";

export const metadata: Metadata = {
  title: "MTR Insight",
  description:
    "Sistema académico de información gerencial con apoyo a la decisión para el Aeropuerto Los Garzones (MTR).",
};

const themeBootScript = `
(function(){
  try {
    var m = document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]*)/);
    var t = m ? decodeURIComponent(m[1]) : 'dark';
    if (t !== 'light' && t !== 'dark') t = 'dark';
    document.documentElement.setAttribute('data-theme', t);
    var lm = document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=([^;]*)/);
    var l = lm ? decodeURIComponent(lm[1]) : 'es';
    document.documentElement.lang = (l === 'en') ? 'en' : 'es';
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      data-theme="dark"
      className={`${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <PreferencesProvider initialTheme="dark" initialLocale="es">
          {children}
        </PreferencesProvider>
      </body>
    </html>
  );
}
