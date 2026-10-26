import { localDateTimeToMs } from '@handoff/contracts';
import type { Prisma } from '../generated/prisma/client';

export const TURNAROUND_MS = 24 * 60 * 60 * 1000;

// Half-open occupied intervals: [pickup, return + 24h). Apply the buffer on
// both sides so a proposed earlier rental cannot consume a later one's pickup.
// Date-only legacy bookings still block inventory using their original columns.
export function conflictingWindow(
  pickupAt: string,
  dropoffAt: string,
): Prisma.BookingWhereInput {
  const end = new Date(localDateTimeToMs(dropoffAt) + TURNAROUND_MS);
  const start = new Date(localDateTimeToMs(pickupAt) - TURNAROUND_MS);
  return {
    status: { in: ['pending', 'confirmed'] },
    AND: [
      {
        OR: [
          { pickupAt: { lt: end } },
          { pickupAt: null, startDate: { lt: end } },
        ],
      },
      {
        OR: [
          { dropoffAt: { gt: start } },
          { dropoffAt: null, endDate: { gt: start } },
        ],
      },
    ],
  };
}
