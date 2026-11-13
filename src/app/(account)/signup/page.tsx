import { redirect } from "next/navigation";
import { AccountForm } from "@/components/account-form";
import { currentAccount } from "@/lib/server/auth";
export const metadata = { title: "Create account | Make My Marriage" };
export default async function SignupPage() {
  const account = await currentAccount();
  if (account) redirect(account.wedding ? "/dashboard" : "/onboarding");
  return <AccountForm mode="signup" />;
}
