import { createHash, randomUUID } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  BookingDetailSchema,
  BookingSchema,
  VehicleSchema,
  localDateTimeToMs,
  type Booking,
  type BookingDetail,
  type Checkout,
  type AccountUser,
  type BookingHistory,
  type BookingEmail,
} from "@handoff/contracts";
import { PrismaService } from "../prisma/prisma.service";
import type { Booking as StoredBooking } from "../generated/prisma/client";
import { PricingService } from "../pricing/pricing.service";
import { CatalogService } from "../catalog/catalog.service";
import { conflictingWindow } from "./availability";
import { EmailService } from "../email/email.service";

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly catalog: CatalogService,
    private readonly email: EmailService,
  ) {}

  async findAll(userId: string, cursor?: string): Promise<BookingHistory> {
    const after = cursor
      ? await this.prisma.booking.findFirst({
          where: { id: cursor, userId },
          select: { id: true, createdAt: true },
        })
      : null;
    if (cursor && !after)
      throw new BadRequestException("Invalid history cursor");
    const bookings = await this.prisma.booking.findMany({
      where: {
        userId,
        ...(after && {
          OR: [
            { createdAt: { lt: after.createdAt } },
            { createdAt: after.createdAt, id: { lt: after.id } },
          ],
        }),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 11,
    });
    return {
      items: bookings.slice(0, 10).map(toContractBooking),
      nextCursor: bookings.length > 10 ? bookings[9].id : null,
    };
  }

  async findOne(id: string, userId: string): Promise<Booking | BookingDetail> {
    const booking = await this.prisma.booking.findFirst({
      where: { id, userId },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    return toContractBooking(booking);
  }

  async create(input: Checkout, user: AccountUser): Promise<BookingDetail> {
    // Normalize equivalent selections before hashing. Identity and authoritative
    // prices never come from the request body.
    const extras = {
      ...input.extras,
      addOnIds: [...new Set(input.extras.addOnIds)].sort(),
    };
    const requestHash = createHash("sha256")
      .update(
        JSON.stringify({
          vehicleId: input.vehicleId,
          expectedTotalCents: input.expectedTotalCents,
          extras,
        }),
      )
      .digest("hex");
    return this.prisma.$transaction(
      async (tx) => {
        // Serialize retries even if a key is reused for a different vehicle.
        // Identity IDs are opaque; no user table exists in the rental schema.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${user.id}, 0))`;
        const previous = await tx.booking.findUnique({
          where: {
            userId_requestKey: {
              userId: user.id,
              requestKey: input.requestKey,
            },
          },
        });
        if (previous) {
          if (previous.requestHash !== requestHash)
            throw new ConflictException(
              "This booking request was already used with different selections. Start a new booking.",
            );
          return BookingDetailSchema.parse(toContractBooking(previous));
        }
        // Concurrent users wait on this row, then see the committed booking.
        await tx.$queryRaw`SELECT id FROM vehicles WHERE id = ${input.vehicleId} FOR UPDATE`;
        const vehicle = await tx.vehicle.findUnique({
          where: { id: input.vehicleId },
          include: { location: true },
        });
        if (!vehicle) throw new NotFoundException("Vehicle not found");
        const pickupAt = new Date(localDateTimeToMs(extras.pickupAt));
        const dropoffAt = new Date(localDateTimeToMs(extras.dropoffAt));
        if (pickupAt.getTime() <= Date.now())
          throw new BadRequestException("Pick-up must be in the future (UTC).");
        if (
          extras.pickupLocationId !== vehicle.locationId ||
          extras.dropoffLocationId !== vehicle.locationId
        )
          throw new BadRequestException(
            "Pick up and return this car at its listed branch.",
          );
        if (extras.acceptedTermsVersion !== this.catalog.getTerms().version)
          throw new ConflictException(
            "Rental terms have changed. Refresh and accept the current terms.",
          );
        const conflict = await tx.booking.findFirst({
          where: {
            vehicleId: vehicle.id,
            ...conflictingWindow(extras.pickupAt, extras.dropoffAt),
          },
          select: { id: true },
        });
        if (conflict)
          throw new ConflictException(
            "This car is unavailable for those times, including its 24-hour return turnaround. Choose another car or different times.",
          );
        const quote = this.pricing.forVehicle(
          {
            vehicleId: vehicle.id,
            ...extras,
          },
          VehicleSchema.parse(vehicle),
        );
        if (input.expectedTotalCents !== quote.totalCents)
          throw new ConflictException(
            "The price has changed. Refresh to review the new total before booking.",
          );
        const checkoutSnapshot = {
          extras,
          quote,
          vehicleTitle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          pickupLocationName: vehicle.location.name,
          pickupAddress: vehicle.location.address,
          subtotalCents: quote.subtotalCents,
          taxCents: quote.taxCents,
          totalCents: quote.totalCents,
          totalLabel: quote.totalLabel,
        };
        const booking = await tx.booking.create({
          data: {
            id: `booking_${randomUUID()}`,
            vehicleId: vehicle.id,
            userId: user.id,
            customerName: user.name,
            customerEmail: user.email,
            status: "confirmed",
            startDate: pickupAt,
            endDate: dropoffAt,
            pickupAt,
            dropoffAt,
            pickupLocationId: extras.pickupLocationId,
            dropoffLocationId: extras.dropoffLocationId,
            addOnIds: extras.addOnIds,
            protectionPlanId: extras.protectionPlanId,
            acceptedTermsVersion: extras.acceptedTermsVersion,
            subtotalCents: quote.subtotalCents,
            taxCents: quote.taxCents,
            totalCents: quote.totalCents,
            requestKey: input.requestKey,
            requestHash,
            checkoutSnapshot,
          },
        });
        const detail = BookingDetailSchema.parse(toContractBooking(booking));
        await this.email.queue(tx, detail);
        return detail;
      },
      { maxWait: 10000, timeout: 15000, isolationLevel: "ReadCommitted" },
    );
  }

  async emailStatus(id: string, userId: string): Promise<BookingEmail> {
    const booking = await this.prisma.booking.findFirst({
      where: { id, userId },
      select: {
        confirmationEmail: { select: { sentAt: true, lastError: true } },
      },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    const email = booking.confirmationEmail;
    return {
      status: !email
        ? "not_requested"
        : email.sentAt
          ? "sent"
          : email.lastError
            ? "retrying"
            : "queued",
      sentAt: email?.sentAt?.toISOString() ?? null,
    };
  }
}

function toContractBooking(booking: StoredBooking): Booking | BookingDetail {
  const base = BookingSchema.parse({
    ...booking,
    startDate: booking.startDate.toISOString().slice(0, 10),
    endDate: booking.endDate.toISOString().slice(0, 10),
    createdAt: booking.createdAt.toISOString(),
  });
  return booking.checkoutSnapshot
    ? BookingDetailSchema.parse({
        ...base,
        ...(booking.checkoutSnapshot as object),
      })
    : base;
}
