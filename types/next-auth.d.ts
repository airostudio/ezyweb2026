import type { DefaultSession } from "next-auth";
import type { PlanId } from "@/lib/plans";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & { plan?: PlanId };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    plan?: PlanId;
    /** When the plan was last read from Stripe (ms since epoch). */
    planCheckedAt?: number;
  }
}
