import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/session";
import { safeReturnTo } from "@/lib/return-to";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const returnTo = safeReturnTo((await searchParams).next);
  if (await getCurrentUser()) redirect(returnTo);
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-28">
      <AuthForm mode="register" returnTo={returnTo} />
    </div>
  );
}
