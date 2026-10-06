"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand";
import { siteConfig } from "@/lib/site";
import styles from "./site-footer.module.css";

const COLUMNS = [
  { title: "Make", links: [{ href: "/create", label: "Create a site" }, { href: "/gallery", label: "Gallery" }, { href: "/pricing", label: "Pricing" }] },
  { title: "You", links: [{ href: "/dashboard", label: "My sites" }, { href: "/dashboard/settings", label: "Settings" }, { href: "/signin", label: "Sign in" }] },
  { title: "Us", links: [{ href: "/about", label: "About" }, { href: "mailto:hello@webese.ai", label: "Say g'day" }] },
];

export function SiteFooter() {
  const pathname = usePathname();
  // The studio and published sites are full-bleed experiences.
  if (pathname?.startsWith("/create") || pathname?.startsWith("/p/")) return null;

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <Link href="/" className={styles.brand}>
              <BrandLogo className={styles.logo} title="ezyweb — home" />
            </Link>
            <p className="muted">Websites for the fun stuff. Made with love (and a lot of flat whites) in Australia.</p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className={styles.col}>
              <h2 className={styles.colTitle}>{col.title}</h2>
              <ul>
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className={styles.giant} aria-hidden>
          <BrandLogo title="" />
        </div>
        <div className={styles.bottom}>
          <p>
            © {new Date().getFullYear()} {siteConfig.company}. All rights reserved.
          </p>
          <p>We acknowledge the Traditional Custodians of the lands on which we work and play.</p>
        </div>
      </div>
    </footer>
  );
}
