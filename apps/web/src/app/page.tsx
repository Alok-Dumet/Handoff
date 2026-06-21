import { getBrandConfig } from "../brands";
import VehicleBrowser from "../components/VehicleBrowser";

export default async function Home() {
  const brand = getBrandConfig(process.env.BRAND);

  return <VehicleBrowser brand={brand} />;
}
