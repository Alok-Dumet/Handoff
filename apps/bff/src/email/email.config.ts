export function emailConfig(env: NodeJS.ProcessEnv = process.env) {
  const bool = (key: string, fallback: boolean) => {
    if (env[key] === undefined) return fallback;
    if (!['true', 'false'].includes(env[key]))
      throw new Error(`${key} must be true or false`);
    return env[key] === 'true';
  };
  const host = env.SMTP_HOST ?? '127.0.0.1';
  const secure = bool('SMTP_SECURE', false);
  const port = Number(env.SMTP_PORT ?? (secure ? 465 : 1025));
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('Invalid SMTP_PORT');
  if (!!env.SMTP_USER !== !!env.SMTP_PASSWORD)
    throw new Error('Set both SMTP_USER and SMTP_PASSWORD');
  const origin = new URL(env.WEB_ORIGIN ?? 'http://localhost:3000');
  if (
    !['http:', 'https:'].includes(origin.protocol) ||
    origin.username ||
    origin.password
  )
    throw new Error('WEB_ORIGIN must be an HTTP(S) origin');
  const from = env.EMAIL_FROM ?? 'HandOff <no-reply@handoff.local>';
  if (/[\r\n]/.test(from)) throw new Error('EMAIL_FROM must be one line');
  return {
    enabled: bool('EMAIL_WORKER_ENABLED', true),
    from,
    origin: origin.origin,
    smtp: {
      host,
      port,
      secure,
      requireTLS: bool('SMTP_REQUIRE_TLS', !!env.SMTP_USER && !secure),
      ...(env.SMTP_USER && {
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD! },
      }),
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      disableFileAccess: true,
      disableUrlAccess: true,
    },
  };
}

export function retryDelay(attempt: number): number {
  return Math.min(
    60 * 60 * 1000,
    5000 * 2 ** Math.min(Math.max(attempt - 1, 0), 10),
  );
}
