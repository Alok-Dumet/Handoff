import { getAuthSession, getCurrentCustomer } from "../../lib/server-api";
import { AccountClient } from "./AccountClient";
import { requireSignedIn } from "../../lib/server-auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  await requireSignedIn("/account");
  const [bffSession, customerProfile] = await Promise.all([
    getAuthSession(),
    getCurrentCustomer(),
  ]);

  return (
    <AccountClient
      bffSession={bffSession}
      customerProfile={customerProfile}
    />
  );
}
