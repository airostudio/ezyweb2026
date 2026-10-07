import type { Metadata } from "next";
import { GalleryBrowser } from "@/components/gallery/gallery-browser";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Pet shrines, birthday bashes, meme museums and more. Browse sites made with aduma.io and remix any of them in one click.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <div className="section" style={{ paddingTop: "clamp(2.5rem, 6vw, 4.5rem)" }}>
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">Community gallery</p>
          <h1 className="h-1">
            The internet&apos;s most <span className="text-gradient">delightful</span> little websites
          </h1>
          <p className="lead">Everything here started as one sentence. Find one you love, hit Remix, and make it yours.</p>
        </header>
        <GalleryBrowser />
      </div>
    </div>
  );
}
