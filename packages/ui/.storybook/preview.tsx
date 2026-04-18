import React from 'react';
import type { Preview } from '@storybook/react';
import { HandoffTheme } from '../src/HandoffTheme';

const preview: Preview = {
  decorators: [
    (Story) => (
      <HandoffTheme>
        <Story />
      </HandoffTheme>
    ),
  ],
};

export default preview;
