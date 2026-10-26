import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/session";

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/vehicles");
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-28">
      <AuthForm mode="register" />
    </div>
  );
}
