"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { useDemoSession } from "@/components/providers/DemoSessionProvider";
import { homeForRole } from "@/domain/access";
import { ThemeLocaleToggles } from "@/components/ui/ThemeLocaleToggles";
import styles from "./landing.module.css";

const ANCHORS = [
  { href: "#medir", key: "product" as const },
  { href: "#metodo", key: "method" as const },
  { href: "#simular", key: "dss" as const },
  { href: "#proyectar", key: "horizon" as const },
  { href: "#gobernar", key: "data" as const },
] as const;

export function LandingNav() {
  const { dict } = usePreferences();
  const { role } = useDemoSession();
  const boardHref = role ? homeForRole(role) : "/login";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={styles.nav}
      data-scrolled={scrolled ? "true" : "false"}
    >
      <div className={styles.navInner}>
        <Link href="/" className={styles.wordmark}>
          {dict.brand}
        </Link>
        <nav aria-label={dict.nav.views} className={styles.anchors}>
          {ANCHORS.map((a) => (
            <a key={a.href} href={a.href}>
              {dict.nav[a.key]}
            </a>
          ))}
        </nav>
        <div className={styles.navActions}>
          <ThemeLocaleToggles />
          <Link href="/login" className={styles.ctaGhost}>
            {dict.nav.signIn}
          </Link>
          <Link href={boardHref} className={styles.cta}>
            {dict.nav.openDashboard}
            <span className={styles.ctaArrow} aria-hidden>
              →
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
