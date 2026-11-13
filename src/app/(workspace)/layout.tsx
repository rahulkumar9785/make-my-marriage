import Link from "next/link";
import type { ReactNode } from "react";
import { requirePageAccount } from "@/lib/server/auth";
import { LogoutButton } from "@/components/logout-button";
export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const account = await requirePageAccount();
  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="account-header">
        <Link href="/" className="wordmark">
          Make My Marriage
        </Link>
        <div className="workspace-user">
          <span>{account.user.name}</span>
          <LogoutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
