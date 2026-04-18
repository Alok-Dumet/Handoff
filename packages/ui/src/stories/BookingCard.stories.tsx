import type { Meta, StoryObj } from '@storybook/react';
import { BookingCard } from '../BookingCard';

const meta: Meta<typeof BookingCard> = {
  title: 'Components/BookingCard',
  component: BookingCard,
};

export default meta;
type Story = StoryObj<typeof BookingCard>;

export const Default: Story = {
  args: {
    bookingRef: 'HO-2024-001',
    customerName: 'Alok Sharma',
    vehicleClass: 'Economy',
    pickupDate: '2024-03-15',
    returnDate: '2024-03-18',
    location: 'London Heathrow T5',
  },
};
