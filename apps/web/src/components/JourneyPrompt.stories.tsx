import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import JourneyPrompt from "./JourneyPrompt";

const meta = {
  title: "Components/JourneyPrompt",
  component: JourneyPrompt,
  parameters: { layout: "padded" },
} satisfies Meta<typeof JourneyPrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PreCheckIn: Story = {
  args: {
    bookingId: "bk_1024",
    journey: {
      type: "pre-check-in",
      label: "Pre-check in",
      path: "/journeys/pre-check-in",
      ctaLabel: "Start pre-check-in",
      description: "Confirm driver details before pickup to save time at the counter.",
    },
  },
};

export const VehicleUpgrade: Story = {
  args: {
    bookingId: "bk_2048",
    journey: {
      type: "vehicle-upgrade",
      label: "Upgrade your vehicle",
      path: "/journeys/vehicle-upgrade",
      ctaLabel: "View upgrades",
      description: "Review eligible upgrade options for this reservation.",
    },
  },
};
