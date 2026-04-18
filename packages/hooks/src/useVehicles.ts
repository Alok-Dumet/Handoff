import useSWR from 'swr';
import { fetcher } from './fetcher';

interface Vehicle {
  id: string;
  name: string;
  class: string;
  pricePerDay: number;
  features: string[];
}

export function useVehicles() {
  const bffUrl = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_BFF_URL
    : '';

  const { data, error, isLoading } = useSWR<Vehicle[]>(
    `${bffUrl}/api/vehicles`,
    fetcher
  );

  return {
    vehicles: data,
    isLoading,
    error,
  };
}
