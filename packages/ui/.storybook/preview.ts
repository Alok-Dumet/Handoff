import type { Preview } from '@storybook/react';
import React from 'react';
import { HandoffTheme } from '../src/HandoffTheme';

const preview: Preview = {
  decorators: [
    (Story) => (
      <HandoffTheme>
        <Story />
      </HandoffTheme>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
};

export default preview;
