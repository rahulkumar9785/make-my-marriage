"use client";

import { useRouter } from "next/navigation";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";

type Mode = "signup" | "login" | "forgot-password" | "reset-password";
const content = {
  signup: {
    eyebrow: "YOUR NEXT CHAPTER",
    title: "Let’s start planning.",
    description: "Create your account. Your wedding workspace comes next.",
    button: "Create account",
    pending: "Creating your account…",
  },
  login: {
    eyebrow: "WELCOME BACK",
    title: "Your plans are waiting.",
    description: "Log in to pick up where you left off.",
    button: "Log in",
    pending: "Logging in…",
  },
  "forgot-password": {
    eyebrow: "A LITTLE HELP",
    title: "Forgot your password?",
    description:
      "Enter your email and we’ll send you a link to choose a new password.",
    button: "Send reset link",
    pending: "Requesting your link…",
  },
  "reset-password": {
    eyebrow: "A FRESH START",
    title: "Choose a new password.",
    description: "Use a password you haven’t used here before.",
    button: "Reset password",
    pending: "Resetting your password…",
  },
};

export function AccountForm({
  mode,
  token = "",
}: {
  mode: Mode;
  token?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);
  const [visible, setVisible] = useState(false);
  const message = useRef<HTMLDivElement>(null);
  const copy = content[mode];
  const hasPassword = mode !== "forgot-password";
  const invalidToken =
    mode === "reset-password" && !/^[a-f0-9]{64}$/.test(token);
  function showError(text: string, fieldErrors: Record<string, string[]> = {}) {
    setError(text);
    setFields(fieldErrors);
    requestAnimationFrame(() => message.current?.focus());
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    if (
      (mode === "signup" || mode === "reset-password") &&
      password !== form.get("confirmPassword")
    ) {
      showError("Your passwords don’t match.", {
        confirmPassword: ["Enter the same password in both fields."],
      });
      return;
    }
    setPending(true);
    setError("");
    setFields({});
    const payload =
      mode === "signup"
        ? { name: form.get("name"), email, password }
        : mode === "login"
          ? { email, password }
          : mode === "forgot-password"
            ? { email }
            : { token, password };
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        showError(
          result.error?.message || "Something went wrong. Please try again.",
          result.error?.fields,
        );
        return;
      }
      if (mode === "signup" || mode === "login") {
        router.replace(result.data.hasWedding ? "/dashboard" : "/onboarding");
      } else {
        setSuccess(true);
        requestAnimationFrame(() => message.current?.focus());
      }
    } catch {
      showError("We couldn’t connect. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }
  const fieldError = (name: string) =>
    fields[name] ? (
      <p className="field-error" id={`${name}-error`}>
        {fields[name].join(" ")}
      </p>
    ) : null;
  return (
    <>
      <p className="eyebrow sage">{copy.eyebrow}</p>
      <h2>{copy.title}</h2>
      <p className="form-intro">{copy.description}</p>
      <div
        ref={message}
        tabIndex={-1}
        className={
          error || success || invalidToken
            ? "form-message"
            : "form-message empty"
        }
        role={error || invalidToken ? "alert" : "status"}
      >
        {error ||
          (invalidToken
            ? "This reset link is missing or invalid. Request a new link."
            : success
              ? mode === "forgot-password"
                ? "If an account exists for this email, a reset link is on its way. Check your inbox and spam folder. The link expires in 30 minutes."
                : "Your password has been updated. Please log in with your new password."
              : "")}
      </div>
      {invalidToken ? (
        <Link className="button form-submit" href="/forgot-password">
          Request a new link
        </Link>
      ) : success ? (
        <Link className="button form-submit" href="/login">
          Back to log in
        </Link>
      ) : (
        <form onSubmit={submit} aria-busy={pending}>
          <fieldset disabled={pending}>
            {mode === "signup" && (
              <div className="form-field">
                <label htmlFor="name">Your name</label>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  aria-invalid={Boolean(fields.name)}
                  aria-describedby={fields.name ? "name-error" : undefined}
                />
                {fieldError("name")}
              </div>
            )}
            {mode !== "reset-password" && (
              <div className="form-field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  aria-invalid={Boolean(fields.email)}
                  aria-describedby={fields.email ? "email-error" : undefined}
                />
                {fieldError("email")}
              </div>
            )}
            {hasPassword && (
              <div className="form-field">
                <label htmlFor="password">
                  {mode === "reset-password" ? "New password" : "Password"}
                </label>
                <div className="password-input">
                  <input
                    id="password"
                    name="password"
                    type={visible ? "text" : "password"}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    required
                    minLength={mode === "login" ? 1 : 12}
                    maxLength={mode === "login" ? 256 : 72}
                    aria-invalid={Boolean(fields.password)}
                    aria-describedby={
                      fields.password
                        ? "password-error"
                        : mode === "login"
                          ? undefined
                          : "password-help"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setVisible(!visible)}
                    aria-label={visible ? "Hide password" : "Show password"}
                    aria-pressed={visible}
                  >
                    {visible ? "Hide" : "Show"}
                  </button>
                </div>
                {mode !== "login" && (
                  <p className="field-help" id="password-help">
                    At least 12 characters, up to 72 bytes. A few memorable
                    words work well.
                  </p>
                )}
                {fieldError("password")}
              </div>
            )}
            {(mode === "signup" || mode === "reset-password") && (
              <div className="form-field">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={visible ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  aria-invalid={Boolean(fields.confirmPassword)}
                  aria-describedby={
                    fields.confirmPassword ? "confirmPassword-error" : undefined
                  }
                />
                {fieldError("confirmPassword")}
              </div>
            )}
            {mode === "login" && (
              <div className="form-link-row">
                <Link href="/forgot-password">Forgot password?</Link>
              </div>
            )}
            <button
              className="button form-submit"
              type="submit"
              disabled={pending}
            >
              {pending ? copy.pending : copy.button}
              <span aria-hidden="true">→</span>
            </button>
          </fieldset>
        </form>
      )}
      <div className="form-bottom">
        {mode === "signup" ? (
          <>
            Already have an account? <Link href="/login">Log in</Link>
            <p className="field-help">
              Your email is used for account access and password recovery.
            </p>
          </>
        ) : mode === "login" ? (
          <>
            New here? <Link href="/signup">Create an account</Link>
          </>
        ) : (
          <Link href="/login">Return to log in</Link>
        )}
      </div>
    </>
  );
}
