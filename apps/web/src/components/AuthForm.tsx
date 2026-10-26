"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoginSchema, RegisterSchema } from "@handoff/contracts";

export default function AuthForm({
  mode,
  returnTo = "/vehicles",
}: {
  mode: "login" | "register";
  returnTo?: string;
}) {
  const router = useRouter();
  const register = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    const parsed = (register ? RegisterSchema : LoginSchema).safeParse({
      name,
      email,
      password,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setPending(true);
    try {
      const response = await fetch(
        `/api/auth/${register ? "register" : "login"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Handoff-CSRF": "1",
          },
          body: JSON.stringify(parsed.data),
        },
      );
      if (!response.ok) {
        const body: unknown = await response.json();
        const message =
          typeof body === "object" &&
          body !== null &&
          "message" in body &&
          typeof body.message === "string"
            ? body.message
            : "Could not sign in. Check your details and try again.";
        setError(message);
        return;
      }
      router.replace(returnTo);
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const field =
    "mt-2 w-full rounded-lg border border-white/20 bg-black px-3 py-2.5 text-white focus:border-white/60 focus:outline-none";
  return (
    <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        {register ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-white/60">
        {register
          ? "Your next rental starts here."
          : "Log in to your HandOff account."}
      </p>
      <form onSubmit={submit} className="mt-7 space-y-5" aria-busy={pending}>
        {register && (
          <div>
            <label htmlFor="name" className="text-sm text-white/80">
              Full name
            </label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={pending}
              className={field}
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="text-sm text-white/80">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm text-white/80">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
            aria-describedby={register ? "password-help" : undefined}
            className={field}
          />
          {register && (
            <p id="password-help" className="mt-2 text-xs text-white/50">
              Use at least 8 characters.
            </p>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
        >
          {pending ? "Please wait…" : register ? "Create account" : "Log in"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-white/60">
        {register ? "Already have an account? " : "New to HandOff? "}
        <Link
          href={`${register ? "/sign-in" : "/sign-up"}?next=${encodeURIComponent(returnTo)}`}
          className="text-white underline underline-offset-4"
        >
          {register ? "Log in" : "Create an account"}
        </Link>
      </p>
      {!register && (
        <div className="mt-7 border-t border-white/10 pt-5 text-sm text-white/60">
          <p>Just exploring? Try the demo account.</p>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setEmail("demo@handoff.local");
              setPassword("DemoRental123!");
              setError("");
            }}
            className="mt-2 text-white underline underline-offset-4"
          >
            Fill demo credentials
          </button>
        </div>
      )}
    </section>
  );
}
