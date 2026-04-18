import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { VehicleCard } from '../VehicleCard';

const meta: Meta<typeof VehicleCard> = {
  title: 'Components/VehicleCard',
  component: VehicleCard,
};

export default meta;
type Story = StoryObj<typeof VehicleCard>;

export const Default: Story = {
  args: {
    name: 'BMW 3 Series',
    class: 'Premium',
    pricePerDay: 95,
    features: ['AC', 'Leather', 'Nav', 'Sunroof'],
    imageUrl: 'https://via.placeholder.com/400x200?text=BMW+3+Series',
    isSelected: false,
    onSelect: () => {},
  },
};

export const Selected: Story = {
  args: {
    ...Default.args,
    isSelected: true,
  },
};

export const SUV: Story = {
  args: {
    name: 'Range Rover Sport',
    class: 'SUV',
    pricePerDay: 145,
    features: ['AC', '4WD', 'Premium Sound', 'Heated Seats'],
    imageUrl: 'https://via.placeholder.com/400x200?text=Range+Rover',
    isSelected: false,
    onSelect: () => {},
  },
};
