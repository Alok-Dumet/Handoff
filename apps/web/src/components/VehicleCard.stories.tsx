import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import VehicleCard from "./VehicleCard";

const meta = {
  title: "Components/VehicleCard",
  component: VehicleCard,
  parameters: { layout: "padded" },
} satisfies Meta<typeof VehicleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Economy: Story = {
  args: {
    vehicle: {
      id: "veh_001",
      title: "2024 Toyota Corolla",
      class: "economy",
      transmission: "automatic",
      seats: 5,
      pricePerDay: 42,
      priceLabel: "$42/day",
    },
  },
};

export const Premium: Story = {
  args: {
    vehicle: {
      id: "veh_003",
      title: "2025 Tesla Model 3",
      class: "premium",
      transmission: "automatic",
      seats: 5,
      pricePerDay: 95,
      priceLabel: "$95/day",
    },
  },
};

export const Suv: Story = {
  args: {
    vehicle: {
      id: "veh_004",
      title: "2024 Jeep Wrangler",
      class: "suv",
      transmission: "manual",
      seats: 5,
      pricePerDay: 78,
      priceLabel: "$78/day",
    },
  },
};
