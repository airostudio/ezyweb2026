import * as z from "zod/mini";

/**
 * Shared Zod schemas: used by API routes (server) and forms (client).
 * Built on `zod/mini` — same validation, a fraction of the bundle size,
 * which matters because the prompt form ships on the landing page.
 */

export const promptSchema = z.string().check(
  z.trim(),
  z.minLength(3, "Give us a few more words to work with ✨"),
  z.maxLength(600, "Whoa, that's an essay. Keep it under 600 characters."),
);

export const generateRequestSchema = z.object({
  prompt: promptSchema,
  siteId: z.optional(z.string().check(z.maxLength(64))),
  // Current page for LLM edits (~30k tokens max, keeps edit cost bounded)
  html: z.optional(z.string().check(z.maxLength(120_000, "That page is too big to edit in one go."))),
  // The spec is produced by our own generator; we only sanity-check its shape.
  spec: z.nullish(
    z.looseObject({
      id: z.string(),
      title: z.string(),
      sections: z.array(z.unknown()),
      theme: z.looseObject({}),
    }),
  ),
});

export const subdomainSchema = z.string().check(
  z.trim(),
  z.toLowerCase(),
  z.minLength(3, "At least 3 characters"),
  z.maxLength(32, "32 characters max"),
  z.regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Letters, numbers and dashes only (no dash at the ends)"),
);

export const customDomainSchema = z.string().check(
  z.trim(),
  z.toLowerCase(),
  z.regex(/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/, "That doesn't look like a domain (try mysite.com.au)"),
);

export const emailSchema = z.object({
  email: z.string().check(z.trim(), z.toLowerCase(), z.email("That email looks a bit wonky")),
});

export const settingsSchema = z.object({
  name: z.string().check(z.trim(), z.minLength(1, "We need something to call you"), z.maxLength(60)),
  username: subdomainSchema,
  marketing: z.boolean(),
});

export type SettingsValues = z.infer<typeof settingsSchema>;
