import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cache } from "react";

type ClerkRequestContext = {
  userId: string;
  email?: string;
  displayName: string;
};

export const getClerkRequestContext = cache(async (): Promise<ClerkRequestContext | null> => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const displayName = user?.fullName ?? user?.username ?? email ?? "HandOff Customer";

  return {
    userId,
    email,
    displayName,
  };
});

export async function getClerkIdentityHeaders(): Promise<HeadersInit> {
  const context = await getClerkRequestContext();

  if (!context) {
    return {};
  }

  const internalSecret = process.env.BFF_INTERNAL_AUTH_SECRET;

  return {
    "x-handoff-clerk-user-id": context.userId,
    "x-handoff-display-name": encodeURIComponent(context.displayName),
    ...(internalSecret ? { "x-handoff-internal-secret": internalSecret } : {}),
    ...(context.email ? { "x-handoff-email": encodeURIComponent(context.email) } : {}),
  };
}

export async function requireSignedIn(redirectTo: string) {
  const context = await getClerkRequestContext();

  if (!context) {
    redirect(`/sign-in?redirectUrl=${encodeURIComponent(redirectTo)}`);
  }

  return context;
}
