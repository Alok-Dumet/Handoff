import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import type { AemNavigationItem } from "@handoff/contracts";
import type { BrandConfig } from "../brands";

export default function BrandSwitcher({
  activeBrand,
  navigation,
}: {
  activeBrand: BrandConfig;
  navigation: AemNavigationItem[];
}) {
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mb: 3 }}>
      {navigation.map((item) => {
        const isActive = item.href.endsWith(`/${activeBrand.id}`);

        return (
          <Button
            key={item.href}
            href={item.href}
            variant={isActive ? "contained" : "outlined"}
            size="small"
          >
            {item.label}
          </Button>
        );
      })}
    </Stack>
  );
}
