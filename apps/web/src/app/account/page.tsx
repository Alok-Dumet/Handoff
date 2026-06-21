import { getAuthSession, getCurrentCustomer } from "../../lib/server-api";
import { AccountClient } from "./AccountClient";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
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
