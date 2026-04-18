import type { Meta, StoryObj } from '@storybook/react';
import { ContentBanner } from '../ContentBanner';

const meta: Meta<typeof ContentBanner> = {
  title: 'Components/ContentBanner',
  component: ContentBanner,
};

export default meta;
type Story = StoryObj<typeof ContentBanner>;

export const WithCTA: Story = {
  args: {
    title: 'Almost There! Complete Your Check-In',
    body: 'Save time at the counter by completing your pre check-in now. It only takes 2 minutes.',
    ctaLabel: 'Start Check-In',
    ctaUrl: '#',
    imageUrl: 'https://via.placeholder.com/400x200?text=Check-In',
  },
};

export const NoCTA: Story = {
  args: {
    title: "You're All Set!",
    body: 'Your e-receipt has been sent to your email. See you at the counter.',
    imageUrl: 'https://via.placeholder.com/400x200?text=Receipt',
  },
};

export const TextOnly: Story = {
  args: {
    title: 'Upgrade Your Ride',
    body: 'Make your journey even better. Choose from our premium selection.',
  },
};
