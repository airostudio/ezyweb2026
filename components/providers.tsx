"use client";

import { MotionConfig } from "framer-motion";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/toast";

/** Client-side providers. `reducedMotion="user"` honours OS settings globally. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MotionConfig reducedMotion="user">
        <ToastProvider>{children}</ToastProvider>
      </MotionConfig>
    </SessionProvider>
  );
}
