"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
export function WeddingForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const [existing, setExisting] = useState(false);
  const message = useRef<HTMLDivElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    setFields({});
    try {
      const response = await fetch("/api/wedding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brideName: form.get("brideName"),
          groomName: form.get("groomName"),
          weddingDate: form.get("weddingDate"),
          timeZone: form.get("timeZone"),
          location: { formattedAddress: form.get("location") },
        }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      if (!response.ok) {
        setError(result.error?.message || "Please try again.");
        setFields(result.error?.fields || {});
        setExisting(result.error?.code === "ALREADY_HAS_WEDDING");
        requestAnimationFrame(() => message.current?.focus());
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError(
        "We couldn’t connect. Please check your connection and try again.",
      );
      requestAnimationFrame(() => message.current?.focus());
    } finally {
      setPending(false);
    }
  }
  function field(name: string, label: string, type = "text", help?: string) {
    const key = name === "location" ? "location.formattedAddress" : name;
    return (
      <div className="form-field">
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          name={name}
          type={type}
          required
          maxLength={name === "location" ? 300 : 100}
          aria-invalid={Boolean(fields[key])}
          aria-describedby={
            fields[key] ? `${name}-error` : help ? `${name}-help` : undefined
          }
        />
        {help && (
          <p className="field-help" id={`${name}-help`}>
            {help}
          </p>
        )}
        {fields[key] && (
          <p className="field-error" id={`${name}-error`}>
            {fields[key].join(" ")}
          </p>
        )}
      </div>
    );
  }
  return (
    <form onSubmit={submit} aria-busy={pending}>
      <div
        ref={message}
        role="alert"
        tabIndex={-1}
        className={error ? "form-message" : "form-message empty"}
      >
        {error}
      </div>
      {existing && (
        <Link className="button form-submit" href="/dashboard">
          Open your dashboard
        </Link>
      )}
      <fieldset disabled={pending || existing}>
        <div className="form-grid">
          {field("brideName", "Bride’s name")}
          {field("groomName", "Groom’s name")}
        </div>
        {field(
          "weddingDate",
          "Wedding date",
          "date",
          "The main wedding day. You can add ceremony schedules in a later milestone.",
        )}
        <div className="form-field">
          <label htmlFor="timeZone">Wedding timezone</label>
          <input
            id="timeZone"
            name="timeZone"
            defaultValue="Asia/Kolkata"
            list="timezones"
            required
            aria-invalid={Boolean(fields.timeZone)}
            aria-describedby={
              fields.timeZone ? "timezone-error" : "timezone-help"
            }
          />
          <datalist id="timezones">
            {[
              "Asia/Kolkata",
              "Asia/Dubai",
              "Europe/London",
              "America/New_York",
              "America/Los_Angeles",
              "Asia/Singapore",
              "Australia/Sydney",
            ].map((zone) => (
              <option key={zone} value={zone} />
            ))}
          </datalist>
          <p className="field-help" id="timezone-help">
            Use an IANA timezone, such as Asia/Kolkata.
          </p>
          {fields.timeZone && (
            <p className="field-error" id="timezone-error">
              {fields.timeZone.join(" ")}
            </p>
          )}
        </div>
        {field(
          "location",
          "Wedding location",
          "text",
          "Enter the venue or city. No map search is needed.",
        )}
        <button
          className="button form-submit"
          disabled={pending || existing}
          type="submit"
        >
          {pending ? "Creating your wedding…" : "Create our wedding"}{" "}
          <span aria-hidden="true">→</span>
        </button>
      </fieldset>
      <p className="field-help form-bottom">
        Your workspace is private. You’ll be its first Admin.
      </p>
    </form>
  );
}
