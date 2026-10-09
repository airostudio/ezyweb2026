"use client";

import { AnimatePresence, m } from "framer-motion";
import { LayoutDashboard, Menu, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import styles from "./site-header.module.css";

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (pathname?.startsWith("/p/")) return null;
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <>
    <header className={cn(styles.header, (scrolled || open) && styles.scrolled)}>
      <div className={cn("container", styles.inner)}>
        <Link href="/" className={styles.brand}>
          <BrandLogo className={styles.logo} title="aduma.io — home" height={56} />
        </Link>

        <nav aria-label="Main" className={styles.nav}>
          <ul>
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.navLink} aria-current={isActive(item.href) ? "page" : undefined}>
                  {isActive(item.href) && (
                    <m.span layoutId="nav-pill" className={styles.pill} transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                  )}
                  <span className={styles.navText}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          {session?.user ? (
            <Link href="/dashboard" className={cn("btn btn-ghost btn-sm", styles.hideSm)}>
              <LayoutDashboard aria-hidden /> My sites
            </Link>
          ) : (
            <Link href="/signin" className={cn("btn btn-ghost btn-sm", styles.hideSm)}>
              Sign in
            </Link>
          )}
          <Link href="/create" className={cn("btn btn-primary btn-sm", styles.hideXs)}>
            <Sparkles aria-hidden /> Make a site
          </Link>
          <button
            type="button"
            className={cn("btn btn-ghost btn-icon btn-sm", styles.menuBtn)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
          </button>
        </div>
      </div>
    </header>

      {/* Rendered outside <header>: the header's backdrop-filter would become
          the containing block for this fixed menu and clip it to the bar. */}
      <AnimatePresence>
        {open && (
          <m.nav
            id="mobile-menu"
            aria-label="Mobile"
            className={styles.mobile}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <ul>
              {[...siteConfig.nav, session?.user ? { href: "/dashboard", label: "My sites" } : { href: "/signin", label: "Sign in" }].map(
                (item, i) => (
                  <m.li key={item.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                    <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
                      {item.label}
                    </Link>
                  </m.li>
                ),
              )}
            </ul>
            <Link href="/create" className="btn btn-electric btn-lg w-full">
              <Sparkles aria-hidden /> Make a site — it&apos;s free
            </Link>
          </m.nav>
        )}
      </AnimatePresence>
    </>
  );
}
