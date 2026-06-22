import { z } from 'zod';
import { JourneyTypeSchema } from '../journeys/journey.schema.js';

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

export const AemJourneyPageContentSchema = z.object({
  journey: JourneyTypeSchema,
  label: z.string().min(1),
  heading: z.string().min(1),
  intro: z.string().min(1),
  body: z.string().min(1),
  primaryActionLabel: z.string().min(1),
});
export type AemJourneyPageContent = z.infer<
  typeof AemJourneyPageContentSchema
>;

export const AemJourneyPageConfigSchema = z.object({
  source: z.literal('mock-aem'),
  version: z.string().min(1),
  pages: z.record(JourneyTypeSchema, AemJourneyPageContentSchema),
});
export type AemJourneyPageConfig = z.infer<typeof AemJourneyPageConfigSchema>;
