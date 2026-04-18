import useSWR from 'swr';
import { fetcher } from './fetcher';

interface Customer {
  id: string;
  name: string;
  email: string;
  loyaltyTier: string;
  biometricConsented: boolean;
}

export function useCustomer(id: string) {
  const bffUrl = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_BFF_URL
    : '';

  const { data, error, isLoading } = useSWR<Customer>(
    id ? `${bffUrl}/api/customer/${id}` : null,
    fetcher
  );

  return {
    customer: data,
    isLoading,
    error,
  };
}
