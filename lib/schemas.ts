import { z } from "zod";

/** Shared Zod schemas: used by API routes (server) and forms (client). */

export const promptSchema = z
  .string()
  .trim()
  .min(3, "Give us a few more words to work with ✨")
  .max(600, "Whoa, that's an essay. Keep it under 600 characters.");

export const generateRequestSchema = z.object({
  prompt: promptSchema,
  // The spec is produced by our own generator; we only sanity-check its shape.
  spec: z
    .object({ id: z.string(), title: z.string(), sections: z.array(z.unknown()), theme: z.object({}).passthrough() })
    .passthrough()
    .nullish(),
});

export const subdomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "At least 3 characters")
  .max(32, "32 characters max")
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Letters, numbers and dashes only (no dash at the ends)");

export const customDomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/, "That doesn't look like a domain (try mysite.com.au)");

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("That email looks a bit wonky")),
});

export const settingsSchema = z.object({
  name: z.string().trim().min(1, "We need something to call you").max(60),
  username: subdomainSchema,
  marketing: z.boolean(),
});

export type SettingsValues = z.infer<typeof settingsSchema>;
