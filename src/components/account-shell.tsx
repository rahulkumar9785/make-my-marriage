import Link from "next/link";
import type { ReactNode } from "react";

export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <div className="account-shell">
      <header className="account-header">
        <Link className="wordmark" href="/">
          Make My Marriage
        </Link>
        <Link href="/#interactive-showcase">
          Explore the platform <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <main className="account-main" id="main">
        <aside className="account-story">
          <p className="eyebrow sage">THE ART OF PLANNING TOGETHER</p>
          <h1>
            A beautiful beginning.
            <br />A little more clarity.
          </h1>
          <p className="lead">
            A place for your plans, your people, and the celebration you’re
            making together.
          </p>
          <div className="account-story-note">
            <span aria-hidden="true">◎</span>
            <p>
              Start with the two of you.
              <br />
              Make room for every moment.
            </p>
          </div>
        </aside>
        <section className="account-card">{children}</section>
      </main>
      <footer className="account-footer">
        Thoughtfully made for you and your families.
      </footer>
    </div>
  );
}
