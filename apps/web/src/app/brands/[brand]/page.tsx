import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrandThemeScope from "../../../components/BrandThemeScope";
import VehicleBrowser from "../../../components/VehicleBrowser";
import { brandConfigs, brandIds, isBrandId } from "../../../brands";
import { requireSignedIn } from "../../../lib/server-auth";

type BrandPageParams = {
  brand: string;
};

export function generateStaticParams() {
  return brandIds.map((brand) => ({ brand }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<BrandPageParams>;
}): Promise<Metadata> {
  const { brand: brandParam } = await params;

  if (!isBrandId(brandParam)) {
    return {};
  }

  const brand = brandConfigs[brandParam];

  return {
    title: brand.metadata.title,
    description: brand.metadata.description,
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<BrandPageParams>;
}) {
  const { brand: brandParam } = await params;

  if (!isBrandId(brandParam)) {
    notFound();
  }

  const brand = brandConfigs[brandParam];

  await requireSignedIn(`/brands/${brandParam}`);

  return (
    <BrandThemeScope brand={brand}>
      <VehicleBrowser brand={brand} />
    </BrandThemeScope>
  );
}
