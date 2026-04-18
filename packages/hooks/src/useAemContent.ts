import useSWR from 'swr';
import { fetcher } from './fetcher';

interface AemContent {
  ':type': string;
  ':path': string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
}

/**
 * Fetches AEM page content from the BFF.
 * This hook is the single integration point for AEM.
 * When real AEM is available, only the BFF endpoint changes — this hook stays the same.
 */
export function useAemContent(pageKey: string) {
  const bffUrl = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_BFF_URL
    : '';

  const { data, error, isLoading } = useSWR<AemContent>(
    pageKey ? `${bffUrl}/api/content/${pageKey}` : null,
    fetcher
  );

  return {
    content: data,
    isLoading,
    error,
  };
}
