import { afterEach, describe, expect, it, vi } from "vitest";
import { getAemJourneyPageContent } from "./server-api";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("server API helpers", () => {
  it("loads journey page content from the BFF", async () => {
    vi.stubEnv("BFF_URL", "http://bff.test");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(journeyPageContent));

    await expect(getAemJourneyPageContent("vehicle-upgrade")).resolves.toEqual(
      journeyPageContent,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://bff.test/content/journeys/vehicle-upgrade",
      {
        cache: "no-store",
      },
    );
  });
});

const journeyPageContent = {
  journey: "vehicle-upgrade",
  label: "Vehicle upgrade",
  heading: "Review upgrade options",
  intro:
    "Compare eligible vehicle upgrades and choose whether to keep or change your reservation class.",
  body:
    "Select a higher-tier vehicle option to review the upgrade and confirm the new reservation class.",
  primaryActionLabel: "Choose upgrade",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
