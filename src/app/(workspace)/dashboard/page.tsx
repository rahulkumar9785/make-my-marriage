import { redirect } from "next/navigation";
import { requirePageAccount } from "@/lib/server/auth";
export const metadata = { title: "Your wedding | Make My Marriage" };
export default async function DashboardPage() {
  const account = await requirePageAccount();
  const wedding = account.wedding;
  if (!wedding) redirect("/onboarding");
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${wedding.weddingDate}T00:00:00Z`));
  return (
    <main className="container workspace-main" id="main">
      <p className="eyebrow sage">
        YOUR WEDDING WORKSPACE · {account.membership?.role}
      </p>
      <h1>{wedding.title}</h1>
      <p className="lead workspace-lead">
        Your celebration has a home. We’re glad you’re here.
      </p>
      <section
        className="wedding-details"
        aria-labelledby="wedding-details-title"
      >
        <h2 id="wedding-details-title">The beginning of your plan</h2>
        <dl>
          <div>
            <dt>Wedding day</dt>
            <dd>{formattedDate}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{wedding.location?.formattedAddress}</dd>
          </div>
          <div>
            <dt>Timezone</dt>
            <dd>{wedding.timeZone}</dd>
          </div>
        </dl>
      </section>
      <div className="workspace-next">
        <p className="eyebrow sage">WHAT COMES NEXT</p>
        <h2>Room for every detail.</h2>
        <p>
          Your account and wedding details are saved. The planning modules below
          are coming in future updates.
        </p>
      </div>
      <div className="workspace-empty-grid">
        {[
          [
            "Events & timeline",
            "No events yet. Ceremony schedules will live here.",
          ],
          [
            "Family tasks",
            "No tasks yet. Give every helping hand a place in the plan.",
          ],
          [
            "Guest folio",
            "No guests yet. Your guest list and responses will live here.",
          ],
          [
            "Budget ledger",
            "No expenses yet. Track commitments and payments here.",
          ],
        ].map(([title, description]) => (
          <section className="workspace-empty" key={title}>
            <span className="tag">COMING NEXT</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
