"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container workspace-main">
      <p className="eyebrow sage">A MOMENT TO RECONNECT</p>
      <h1>We couldn’t open this page.</h1>
      <p>Please try again in a moment. Your saved plans will be here.</p>
      <div className="actions">
        <button className="button" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="button secondary">
          Return home
        </Link>
      </div>
    </main>
  );
}
