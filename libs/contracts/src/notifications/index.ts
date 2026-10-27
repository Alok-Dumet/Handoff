import { z } from "zod";
// Internal version-one delivery envelope. Rental owns the immutable receipt;
// Notifications owns acceptance, SMTP attempts, and delivery state.
export const ConfirmationDeliverySchema = z
  .object({
    bookingId: z.string().min(1).max(200),
    recipient: z.string().email().max(320),
    subject: z
      .string()
      .min(1)
      .max(500)
      .regex(/^[^\r\n]+$/),
    text: z.string().max(50000),
    html: z.string().max(100000),
    messageId: z
      .string()
      .min(1)
      .max(300)
      .regex(/^[^\r\n]+$/),
    createdAt: z.string().datetime(),
  })
  .strict();
export type ConfirmationDelivery = z.infer<typeof ConfirmationDeliverySchema>;
export const DeliveryStatusSchema = z.object({
  status: z.enum(["queued", "retrying", "sent"]),
  sentAt: z.string().datetime().nullable(),
});
export function notificationServiceKey(
  env: Record<string, string | undefined>,
): string {
  if (env.NOTIFICATIONS_SERVICE_KEY) return env.NOTIFICATIONS_SERVICE_KEY;
  if (env.NODE_ENV === "production")
    throw new Error("NOTIFICATIONS_SERVICE_KEY is required");
  return "handoff-local-notifications-key";
}
export function deliveryRetryDelay(attempt: number): number {
  return Math.min(3600000, 5000 * 2 ** Math.min(Math.max(attempt - 1, 0), 10));
}
