import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import type { BrandConfig } from "../brands";
import { brandIds, brandConfigs } from "../brands";

export default function BrandSwitcher({ activeBrand }: { activeBrand: BrandConfig }) {
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mb: 3 }}>
      {brandIds.map((brandId) => {
        const brand = brandConfigs[brandId];

        return (
          <Button
            key={brand.id}
            href={`/brands/${brand.id}`}
            variant={brand.id === activeBrand.id ? "contained" : "outlined"}
            size="small"
          >
            {brand.shortName}
          </Button>
        );
      })}
    </Stack>
  );
}
