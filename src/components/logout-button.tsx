"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="logout">
      <button
        className="button secondary small"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            const response = await fetch("/api/auth/logout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            });
            if (!response.ok) throw new Error();
            router.replace("/login");
            router.refresh();
          } catch {
            setError("Couldn’t log out. Please try again.");
            setPending(false);
          }
        }}
      >
        {pending ? "Logging out…" : "Log out"}
      </button>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
