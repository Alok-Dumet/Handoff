import { requireSignedIn } from "../../lib/server-auth";
import { getBrandConfig } from "../../brands";
import VehicleBrowser from "../../components/VehicleBrowser";

export default async function VehiclesPage() {
  await requireSignedIn("/vehicles");
  const brand = getBrandConfig(process.env.BRAND);

  return <VehicleBrowser brand={brand} />;
}
