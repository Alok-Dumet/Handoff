import { randomUUID } from "node:crypto";
import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from "@nestjs/common";
import {
  DeliveryStatusSchema,
  notificationServiceKey,
  deliveryRetryDelay,
  type BookingDetail,
} from "@handoff/contracts";
import { PrismaService } from "../prisma/prisma.service";
import type { Prisma, ConfirmationEmail } from "../generated/prisma/client";
import { confirmationMessage } from "./confirmation-message";

// Rental owns this transactional outbox and its local delivery-status projection.
// Only Notifications connects to SMTP or reads its own delivery database.
@Injectable()
export class EmailService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private readonly endpoint = new URL(
    "/internal/confirmations",
    process.env.NOTIFICATIONS_URL ?? "http://127.0.0.1:3002",
  );
  private readonly key = notificationServiceKey(process.env);
  private readonly origin = new URL(
    process.env.WEB_ORIGIN ?? "http://localhost:3000",
  ).origin;
  private timer?: ReturnType<typeof setInterval>;
  private running?: Promise<void>;
  private stopping = false;
  constructor(private readonly prisma: PrismaService) {}
  async queue(tx: Prisma.TransactionClient, booking: BookingDetail) {
    await tx.confirmationEmail.create({
      data: confirmationMessage(booking, this.origin),
    });
  }
  onApplicationBootstrap() {
    if (process.env.EMAIL_WORKER_ENABLED === "false") return;
    this.timer = setInterval(() => {
      void this.processDue();
    }, 5000);
    this.timer.unref();
    void this.processDue();
  }
  async onModuleDestroy() {
    this.stopping = true;
    clearInterval(this.timer);
    await this.running;
  }
  processDue(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.drain()
      .catch(() => {
        this.logger.warn("Confirmation outbox unavailable; retry scheduled");
      })
      .finally(() => {
        this.running = undefined;
      });
    return this.running;
  }
  private async drain() {
    for (let i = 0; i < 10 && !this.stopping; i++) {
      const token = randomUUID();
      const jobs = await this.prisma.$queryRaw<ConfirmationEmail[]>`
        WITH due AS (
          SELECT "bookingId" FROM confirmation_emails
          WHERE "sentAt" IS NULL AND "nextAttemptAt" <= CURRENT_TIMESTAMP
            AND ("lockedUntil" IS NULL OR "lockedUntil" < CURRENT_TIMESTAMP)
          ORDER BY "nextAttemptAt", "bookingId" FOR UPDATE SKIP LOCKED LIMIT 1
        )
        UPDATE confirmation_emails AS job
        SET "lockedUntil" = CURRENT_TIMESTAMP + INTERVAL '5 minutes',
            "lockToken" = ${token}, attempts = attempts + 1
        FROM due WHERE job."bookingId" = due."bookingId" RETURNING job.*`;
      const job = jobs[0];
      if (!job) return;
      try {
        const {
          bookingId,
          recipient,
          subject,
          text,
          html,
          messageId,
          createdAt,
        } = job;
        // Repeating an accepted delivery returns its current state; a lost reply
        // or rental restart cannot create another notification.
        const response = await fetch(this.endpoint, {
          method: "POST",
          signal: AbortSignal.timeout(5000),
          headers: {
            "Content-Type": "application/json",
            "X-Service-Key": this.key,
          },
          body: JSON.stringify({
            bookingId,
            recipient,
            subject,
            text,
            html,
            messageId,
            createdAt: createdAt.toISOString(),
          }),
        });
        if (!response.ok) throw new Error("Notifications unavailable");
        const result = DeliveryStatusSchema.parse(await response.json());
        await this.prisma.confirmationEmail.updateMany({
          where: { bookingId, lockToken: token },
          data: {
            sentAt: result.sentAt ? new Date(result.sentAt) : null,
            lastError:
              result.status === "retrying" ? "Delivery attempt failed" : null,
            nextAttemptAt: new Date(Date.now() + 5000),
            lockedUntil: null,
            lockToken: null,
          },
        });
      } catch {
        await this.prisma.confirmationEmail.updateMany({
          where: { bookingId: job.bookingId, lockToken: token },
          data: {
            lastError: "Notification service unavailable",
            nextAttemptAt: new Date(
              Date.now() + deliveryRetryDelay(job.attempts),
            ),
            lockedUntil: null,
            lockToken: null,
          },
        });
      }
    }
  }
}
