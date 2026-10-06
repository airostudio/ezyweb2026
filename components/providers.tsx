"use client";

import { LazyMotion, MotionConfig } from "framer-motion";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/toast";

const loadMotionFeatures = () => import("@/lib/motion-features").then((mod) => mod.default);

/**
 * Client-side providers.
 *  - LazyMotion: components use the tiny `m.*` primitives; the animation
 *    engine streams in after hydration (`strict` forbids heavy `motion.*`).
 *  - `reducedMotion="user"` honours the OS setting globally.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LazyMotion features={loadMotionFeatures} strict>
        <MotionConfig reducedMotion="user">
          <ToastProvider>{children}</ToastProvider>
        </MotionConfig>
      </LazyMotion>
    </SessionProvider>
  );
}
