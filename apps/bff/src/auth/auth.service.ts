import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  identityServiceKey,
  IdentityLoginResultSchema,
  SessionResponseSchema,
  type Login,
  type Register,
  type AccountUser,
} from '@handoff/contracts';
@Injectable()
export class AuthService {
  private readonly origin = process.env.IDENTITY_URL ?? 'http://127.0.0.1:3003';
  private readonly key = identityServiceKey(process.env);
  private async request(path: string, body: unknown): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(new URL(`/internal/auth/${path}`, this.origin), {
        method: 'POST',
        signal: AbortSignal.timeout(5000),
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Key': this.key,
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Account service unavailable. Please try again.',
      );
    }
    if (response.status === 401 && path === 'login')
      throw new UnauthorizedException('Email or password is incorrect');
    if (response.status === 409)
      throw new ConflictException('An account with this email already exists');
    if (response.status === 400)
      throw new BadRequestException('Invalid account request');
    if (!response.ok)
      throw new ServiceUnavailableException(
        'Account service unavailable. Please try again.',
      );
    if (response.status === 204) return null;
    try {
      return await response.json();
    } catch {
      throw new ServiceUnavailableException(
        'Account service unavailable. Please try again.',
      );
    }
  }
  async register(input: Register, token?: string) {
    return IdentityLoginResultSchema.parse(
      await this.request('register', { input, token }),
    );
  }
  async login(input: Login, token?: string) {
    return IdentityLoginResultSchema.parse(
      await this.request('login', { input, token }),
    );
  }
  async currentUser(token?: string): Promise<AccountUser | null> {
    if (!token) return null;
    return SessionResponseSchema.parse(await this.request('session', { token }))
      .user;
  }
  async logout(token?: string): Promise<void> {
    if (token) await this.request('logout', { token });
  }
}
