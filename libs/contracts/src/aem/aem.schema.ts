import { z } from 'zod';

export const AemBrandKeySchema = z.enum(['handoff', 'roadline']);
export type AemBrandKey = z.infer<typeof AemBrandKeySchema>;

export const AemNavigationItemSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1).startsWith('/'),
});
export type AemNavigationItem = z.infer<typeof AemNavigationItemSchema>;

export const AemPageContentSchema = z.object({
  brandKey: AemBrandKeySchema,
  eyebrow: z.string().min(1),
  heading: z.string().min(1),
  intro: z.string().min(1),
  recentBookingsHeading: z.string().min(1),
  recentBookingsEmpty: z.string().min(1),
  recentBookingsError: z.string().min(1),
  navigation: z.array(AemNavigationItemSchema).min(1),
});
export type AemPageContent = z.infer<typeof AemPageContentSchema>;

export const AemPageConfigSchema = z.object({
  source: z.literal('mock-aem'),
  version: z.string().min(1),
  pages: z.record(AemBrandKeySchema, AemPageContentSchema),
});
export type AemPageConfig = z.infer<typeof AemPageConfigSchema>;
