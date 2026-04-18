import type { Meta, StoryObj } from '@storybook/react';
import { StepperNav } from '../StepperNav';

const meta: Meta<typeof StepperNav> = {
  title: 'Components/StepperNav',
  component: StepperNav,
};

export default meta;
type Story = StoryObj<typeof StepperNav>;

export const PreCheckin: Story = { args: { activeStep: 0 } };
export const Biometric: Story = { args: { activeStep: 1 } };
export const Upgrade: Story = { args: { activeStep: 2 } };
export const Receipt: Story = { args: { activeStep: 3 } };
