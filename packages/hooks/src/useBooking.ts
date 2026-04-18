import useSWR from 'swr';
import { fetcher } from './fetcher';

interface Booking {
  bookingRef: string;
  customerName: string;
  vehicleClass: string;
  pickupDate: string;
  returnDate: string;
  location: string;
  status: string;
}

export function useBooking(id: string) {
  const bffUrl = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_BFF_URL
    : '';

  const { data, error, isLoading } = useSWR<Booking>(
    id ? `${bffUrl}/api/reservation/${id}` : null,
    fetcher
  );

  return {
    booking: data,
    isLoading,
    error,
  };
}
