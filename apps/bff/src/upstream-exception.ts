import { HttpException } from '@nestjs/common';

export async function toUpstreamException(
  res: Response,
  fallbackMessage: string,
): Promise<HttpException> {
  let body: string | Record<string, unknown> = fallbackMessage;

  try {
    const jsonBody: unknown = await res.json();
    body =
      typeof jsonBody === 'object' && jsonBody !== null
        ? (jsonBody as Record<string, unknown>)
        : String(jsonBody);
  } catch {
    // Keep the fallback body when the upstream service did not return JSON.
  }

  return new HttpException(body, res.status);
}
