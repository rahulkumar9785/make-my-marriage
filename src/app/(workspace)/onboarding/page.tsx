import { redirect } from "next/navigation";
import { requirePageAccount } from "@/lib/server/auth";
import { WeddingForm } from "@/components/wedding-form";
export const metadata = { title: "Set up your wedding | Make My Marriage" };
export default async function OnboardingPage() {
  const account = await requirePageAccount();
  if (account.wedding) redirect("/dashboard");
  return (
    <main className="onboarding-main" id="main">
      <div className="onboarding-heading">
        <p className="eyebrow sage">YOUR SHARED CELEBRATION</p>
        <h1>Let’s make it yours.</h1>
        <p>A few details to give your wedding a place to begin.</p>
      </div>
      <section
        className="account-card onboarding-card"
        aria-label="Wedding details"
      >
        <WeddingForm />
      </section>
    </main>
  );
}
