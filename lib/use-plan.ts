"use client";

import { useSession } from "next-auth/react";
import { PLAN_LIMITS, type PlanLimits } from "@/lib/plans";

/** The current visitor's plan limits (guests and signed-in free users get Free). */
export function usePlan(): PlanLimits {
  const { data } = useSession();
  return PLAN_LIMITS[data?.user?.plan ?? "free"];
}
