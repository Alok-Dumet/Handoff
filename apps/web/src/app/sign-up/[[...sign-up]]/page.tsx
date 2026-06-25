import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <SignUp />
    </div>
  );
}
