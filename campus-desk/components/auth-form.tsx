"use client";
import Link from "next/link";
import { useState } from "react";
import { authClient, authErrorMessage } from "@/lib/browser";
import { registrationSchema, loginSchema } from "@/lib/validation";
import { FieldError } from "./ui";

export default function AuthForm({ register = false }: { register?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) {
      return;
    }
    setError("");
    setFields({});
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = (register ? registrationSchema : loginSchema).safeParse(
      values,
    );
    if (!parsed.success) {
      setFields(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ]),
        ),
      );
      return;
    }
    setBusy(true);
    try {
      const result = register
        ? await authClient.signUp.email(
            parsed.data as { name: string; email: string; password: string },
          )
        : await authClient.signIn.email(parsed.data);
      if (result.error)
        throw new Error(authErrorMessage(result.error.status, register));
      window.location.assign("/dashboard");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not connect. Please try again.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh grid-cols-2 max-[700px]:grid-cols-1">
      <aside className="flex flex-col justify-between bg-[#173e3b] px-[12%] py-[12vh] text-white [&_h1]:max-w-[460px] [&_h1]:text-[clamp(36px,4vw,58px)] [&_p]:max-w-[400px] [&_p]:text-[#d1e3db] max-[700px]:gap-6 max-[700px]:px-6 max-[700px]:py-[26px] max-[700px]:[&_h1]:mb-2.5 max-[700px]:[&_h1]:text-[30px] max-[700px]:[&_p]:m-0 max-[700px]:[&_small]:hidden">
        <Link
          href="/"
          className="px-2.5 text-[22px] font-bold tracking-wide text-white no-underline max-[700px]:px-0 max-[700px]:text-[19px]"
        >
          CAMPUS DESK
        </Link>
        <div>
          <h1>
            Campus services,
            <br />
            simplified.
          </h1>
          <p>
            Transcripts, student ID cards, IT help and more. One place to ask,
            one place to follow up.
          </p>
        </div>
        <small>Built around your campus day.</small>
      </aside>
      <main className="flex flex-col justify-center px-[10%] py-[8vh] [&_h1]:mb-3 [&_form]:mt-6 max-[700px]:px-6 max-[700px]:py-[30px]">
        <h1>{register ? "Create your account" : "Welcome back"}</h1>
        <p className="text-[var(--muted)]">
          {register
            ? "Submit requests and keep track of their progress."
            : "Log in to see what is happening with your requests."}
        </p>
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg bg-[#fff1ef] px-[18px] py-3.5 text-[#862b20] [overflow-wrap:anywhere]"
          >
            {error}
          </div>
        )}
        <form
          className="grid max-w-[740px] gap-[22px]"
          onSubmit={submit}
          noValidate
        >
          {register && (
            <label>
              Full name
              <input
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
                aria-invalid={!!fields.name}
                aria-describedby={fields.name ? "name-error" : undefined}
              />
              <FieldError name="name" fields={fields} />
            </label>
          )}
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              aria-invalid={!!fields.email}
              aria-describedby={fields.email ? "email-error" : undefined}
            />
            <FieldError name="email" fields={fields} />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={register ? 12 : 1}
              maxLength={128}
              required
              aria-invalid={!!fields.password}
              aria-describedby={
                fields.password
                  ? "password-error"
                  : register
                    ? "password-hint"
                    : undefined
              }
            />
            <FieldError name="password" fields={fields} />
          </label>
          {register && (
            <small id="password-hint" className="text-[var(--muted)]">
              Use 12 to 128 characters.
            </small>
          )}
          <button
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-[#1d6257] px-[18px] py-[11px] font-semibold text-white no-underline"
            disabled={busy}
          >
            {busy ? "Please wait..." : register ? "Create account" : "Log in"}
          </button>
        </form>
        <p style={{ marginTop: 24 }}>
          {register ? "Already have an account?" : "New to Campus Desk?"}{" "}
          <Link href={register ? "/login" : "/register"}>
            {register ? "Log in" : "Create an account"}
          </Link>
        </p>
      </main>
    </div>
  );
}
