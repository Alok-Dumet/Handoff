import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return (
    <div className="flex flex-1 flex-col px-6 pb-16 pt-28">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Your account
        </h1>
        <p className="mt-2 text-white/60">Welcome, {user.name}.</p>
        <dl className="mt-8 space-y-5 rounded-xl border border-white/10 bg-white/5 p-6">
          <div>
            <dt className="text-sm text-white/50">Full name</dt>
            <dd className="mt-1 break-words text-white">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-white/50">Email address</dt>
            <dd className="mt-1 break-words text-white">{user.email}</dd>
          </div>
        </dl>
        <Link href="/bookings" className="mt-6 block text-white underline">
          View your booking history
        </Link>
        <Link
          href="/vehicles"
          className="mt-8 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-black"
        >
          Browse cars
        </Link>
      </div>
    </div>
  );
}
