import { randomBytes } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AccountUserSchema,
  type AccountUser,
  type Login,
  type Register,
} from '@handoff/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { hashPassword, verifyPassword } from './password';
import { SESSION_DURATION_MS, tokenHash } from './session-cookie';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: Register, oldToken?: string) {
    const passwordHash = await hashPassword(input.password);
    const token = randomBytes(32).toString('hex');
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { name: input.name, email: input.email, passwordHash },
        });
        if (oldToken)
          await tx.session.deleteMany({
            where: { tokenHash: tokenHash(oldToken) },
          });
        await tx.session.create({
          data: {
            tokenHash: tokenHash(token),
            userId: user.id,
            expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
          },
        });
        return user;
      });
      return { user: AccountUserSchema.parse(user), token };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw error;
    }
  }

  async login(input: Login, oldToken?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!(await verifyPassword(input.password, user?.passwordHash)) || !user) {
      throw new UnauthorizedException('Email or password is incorrect');
    }
    const token = randomBytes(32).toString('hex');
    await this.prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({
        where: {
          OR: [
            { expiresAt: { lte: new Date() } },
            ...(oldToken ? [{ tokenHash: tokenHash(oldToken) }] : []),
          ],
        },
      });
      await tx.session.create({
        data: {
          tokenHash: tokenHash(token),
          userId: user.id,
          expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
        },
      });
    });
    return { user: AccountUserSchema.parse(user), token };
  }

  async currentUser(token?: string): Promise<AccountUser | null> {
    if (!token) return null;
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!session || session.expiresAt.getTime() <= Date.now()) return null;
    return AccountUserSchema.parse(session.user);
  }

  async logout(token?: string): Promise<void> {
    if (token)
      await this.prisma.session.deleteMany({
        where: { tokenHash: tokenHash(token) },
      });
  }
}
