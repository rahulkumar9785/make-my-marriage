import { AccountForm } from "@/components/account-form";
export const metadata = {
  title: "Reset password | Make My Marriage",
  referrer: "no-referrer" as const,
};
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <AccountForm
      mode="reset-password"
      token={typeof token === "string" ? token : ""}
    />
  );
}
