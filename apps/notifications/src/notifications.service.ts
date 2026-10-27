import { randomUUID } from "node:crypto";
import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from "@nestjs/common";
import nodemailer from "nodemailer";
import { ConflictException, NotFoundException } from "@nestjs/common";
import type { ConfirmationDelivery } from "@handoff/contracts";
import { PrismaService } from "./prisma/prisma.service";
import type { ConfirmationEmail } from "./generated/prisma/client";
import { emailConfig, retryDelay } from "./email.config";

@Injectable()
export class NotificationsService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationsService.name);
  private readonly config = emailConfig();
  private readonly transport = nodemailer.createTransport(this.config.smtp);
  private timer?: ReturnType<typeof setInterval>;
  private running?: Promise<void>;
  private stopping = false;

  constructor(private readonly prisma: PrismaService) {}

  async accept(input: ConfirmationDelivery) {
    const job = await this.prisma.confirmationEmail.upsert({
      where: { bookingId: input.bookingId },
      update: {},
      create: { ...input, createdAt: new Date(input.createdAt) },
    });
    // A repeated event must carry the same immutable receipt, not overwrite it.
    for (const key of [
      "recipient",
      "subject",
      "text",
      "html",
      "messageId",
    ] as const) {
      if (job[key] !== input[key])
        throw new ConflictException("Event payload differs");
    }
    return this.status(input.bookingId);
  }

  async status(bookingId: string) {
    const job = await this.prisma.confirmationEmail.findUnique({
      where: { bookingId },
    });
    if (!job) throw new NotFoundException("Confirmation not found");
    return {
      status: job.sentAt ? "sent" : job.lastError ? "retrying" : "queued",
      sentAt: job.sentAt?.toISOString() ?? null,
    };
  }

  onApplicationBootstrap() {
    if (!this.config.enabled) return;
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
    this.transport.close();
  }

  // Public for deterministic integration tests and operational draining; no
  // public HTTP endpoint can trigger or select another user's delivery.
  processDue(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.drain()
      .catch(() => {
        // Database/transport errors must never bring down the booking API, and
        // provider errors can contain recipient addresses or SMTP credentials.
        this.logger.warn(
          "Email queue unavailable; will retry on the next poll",
        );
      })
      .finally(() => {
        this.running = undefined;
      });
    return this.running;
  }

  private async drain() {
    for (let i = 0; i < 10 && !this.stopping; i++) {
      const token = randomUUID();
      // Release the database lock before SMTP. Timeouts limit ordinary stalls;
      // the lease recovers work after a crash. SMTP delivery remains at least once.
      const jobs = await this.prisma.$queryRaw<ConfirmationEmail[]>`
        WITH due AS (
          SELECT "bookingId" FROM confirmation_emails
          WHERE "sentAt" IS NULL AND "nextAttemptAt" <= CURRENT_TIMESTAMP
            AND ("lockedUntil" IS NULL OR "lockedUntil" < CURRENT_TIMESTAMP)
          ORDER BY "nextAttemptAt", "bookingId"
          FOR UPDATE SKIP LOCKED LIMIT 1
        )
        UPDATE confirmation_emails AS job
        SET "lockedUntil" = CURRENT_TIMESTAMP + INTERVAL '5 minutes',
            "lockToken" = ${token}, attempts = attempts + 1
        FROM due WHERE job."bookingId" = due."bookingId"
        RETURNING job.*`;
      const job = jobs[0];
      if (!job) return;
      try {
        await this.transport.sendMail({
          from: this.config.from,
          to: { address: job.recipient, name: "" },
          subject: job.subject,
          text: job.text,
          html: job.html,
          messageId: job.messageId,
          date: job.createdAt,
        });
        await this.prisma.confirmationEmail.updateMany({
          where: { bookingId: job.bookingId, lockToken: token },
          data: {
            sentAt: new Date(),
            lockedUntil: null,
            lockToken: null,
            lastError: null,
          },
        });
      } catch {
        await this.prisma.confirmationEmail.updateMany({
          where: { bookingId: job.bookingId, lockToken: token },
          data: {
            lockedUntil: null,
            lockToken: null,
            lastError: "Delivery attempt failed",
            nextAttemptAt: new Date(Date.now() + retryDelay(job.attempts)),
          },
        });
        this.logger.warn(
          `Confirmation ${job.bookingId} delayed; retry scheduled`,
        );
      }
    }
  }
}
