import React from 'react';
import type { Metadata } from 'next';
import { ThemeRegistry } from './ThemeRegistry';

export const metadata: Metadata = {
  title: 'Handoff — Car Rental Journey',
  description: 'Post-booking customer journey for car rental',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
