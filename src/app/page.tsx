"use client";

import { useState } from "react";

const events = [
  ["Mehendi & High Tea", "Nov 14 · 14:00 IST · Haveli Lawn", "Bride Lead"],
  ["Sangeet Soirée", "Nov 14 · 19:30 IST · Grand Ballroom", "Joint Effort"],
  [
    "Vedic Pheras & Ceremony",
    "Nov 15 · 10:30 IST · Mandap Terrace",
    "Joint Effort",
  ],
  [
    "Evening Reception Banquet",
    "Nov 15 · 20:00 IST · Palace Courtyard",
    "Groom Lead",
  ],
];
const tabs = [
  "Budget Ledger (INR)",
  "Events & Timeline",
  "Guest Folio",
  "Family Tasks",
];
const features = [
  [
    "CHOREOGRAPHED EXECUTION",
    "Multi-Day Run-of-Show",
    "From the first mehendi to the final farewell, give every ceremony its own thoughtful plan.",
    "18:15 IST · Couple’s entrance",
    "18:45 IST · Ceremony begins",
  ],
  [
    "COLLABORATIVE HARMONY",
    "Family Roles Delegation",
    "Give every helping hand a clear role. Keep your family connected without the endless follow-ups.",
    "Welcome desk · Dev & Ritu",
    "Pooja essentials · Maasi",
  ],
  [
    "FINANCIAL CLARITY",
    "A Thoughtful Budget Ledger",
    "Keep vendor commitments, payments, and family contributions together in one clear picture.",
    "₹48,50,000 allocated",
    "64% of payments settled",
  ],
  [
    "WARMER WELCOMES",
    "Household RSVPs",
    "A little more care for every guest. Organize households, dietary preferences, and accommodation.",
    "112 households confirmed",
    "24 little guests attending",
  ],
  [
    "MEMORIES THAT STAY",
    "Your Wedding Photo Folio",
    "Bring the moments captured by everyone you love into one shared collection.",
    "Mehendi · Sangeet · Pheras",
    "Every perspective, together",
  ],
];

export default function HomePage() {
  const [tab, setTab] = useState(0);
  const [menu, setMenu] = useState(false);
  const [preview, setPreview] = useState(false);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="header">
        <div className="nav-wrap">
          <a className="wordmark" href="#overview">
            Make My Marriage
          </a>
          <nav
            aria-label="Main navigation"
            className={menu ? "nav open" : "nav"}
          >
            {[
              ["Overview", "overview"],
              ["Workspaces", "workspaces"],
              ["Budget Ledger", "ledger"],
              ["Timeline", "timeline"],
              ["Invitations", "invitations"],
            ].map(([label, id]) => (
              <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>
                {label}
              </a>
            ))}
            <button
              className="button small mobile-planning"
              onClick={() => {
                setMenu(false);
                setPreview(true);
              }}
            >
              Begin Planning <span aria-hidden="true">↗</span>
            </button>
          </nav>
          <button
            className="button small header-planning"
            onClick={() => setPreview(true)}
          >
            Begin Planning <span aria-hidden="true">↗</span>
          </button>
          <button
            className="menu-button"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            ☰
          </button>
        </div>
      </header>
      <main id="main">
        <section className="container hero" id="overview">
          <div className="hero-copy">
            <p className="badge">THE ART OF PLANNING TOGETHER</p>
            <h1>
              Your wedding,
              <br />
              beautifully organized.
            </h1>
            <p className="lead">
              Every event, every detail, and both families — together in one
              thoughtfully designed space built for clarity, connection, and
              quiet elegance.
            </p>
            <div className="actions">
              <button className="button" onClick={() => setPreview(true)}>
                Start Planning <span aria-hidden="true">→</span>
              </button>
              <a className="button secondary" href="#interactive-showcase">
                Explore the Platform
              </a>
            </div>
            <p className="micro">Less coordinating. More celebrating.</p>
          </div>
          <div
            className="dashboard"
            aria-label="Example wedding planning dashboard"
          >
            <div className="dashboard-top">
              <div className="celebration">
                <span className="window-dots" aria-hidden="true">
                  ● ● ●
                </span>
                <div>
                  <strong>Aanya & Kabir’s Celebration</strong>
                  <p>Jaipur · Royal Pavilion & Courtyard</p>
                </div>
              </div>
              <span className="badge">68 days to Sangeet</span>
            </div>
            <div className="dashboard-body">
              <aside className="sidebar">
                <p className="eyebrow">ACTIVE WORKSPACE</p>
                <div className="workspace">◎ &nbsp; Joint Master View</div>
                {[
                  "Overview",
                  "Timeline & Run-of-Show",
                  "Budget & Family Ledger",
                  "Guest Folio & Suites",
                  "Curated Vendors",
                  "Floorplans & Seating",
                ].map((item, i) => (
                  <a
                    className={i === 0 ? "active" : ""}
                    href={i === 1 ? "#timeline" : "#interactive-showcase"}
                    key={item}
                  >
                    <span aria-hidden="true">
                      {["▦", "◷", "▤", "♧", "◇", "▧"][i]}
                    </span>
                    {item}
                  </a>
                ))}
                <div className="sync">
                  <strong>Bride + Groom Sync</strong>
                  <p>Both families, one celebration.</p>
                  <span className="sage">✓ Connected</span>
                </div>
              </aside>
              <div className="dashboard-content">
                <div className="metrics">
                  {[
                    [
                      "TOTAL BUDGET ALLOCATION",
                      "₹48,50,000",
                      "64% settled",
                      "64%",
                    ],
                    ["GUEST ATTENDANCE", "342", "/ 410 invited", "83%"],
                    ["MILESTONES COMPLETE", "28", "/ 42 tasks", "66%"],
                  ].map(([label, value, note, width]) => (
                    <div className="metric" key={label}>
                      <p className="eyebrow">{label}</p>
                      <div>
                        <strong>{value}</strong>
                        <small>{note}</small>
                      </div>
                      <div className="progress">
                        <span style={{ width }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="dashboard-panels">
                  <div className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Master Itinerary</h3>
                        <p>Synchronized ceremony planning</p>
                      </div>
                      <span className="tag">3 DAYS</span>
                    </div>
                    <EventList />
                  </div>
                  <div className="panel ledger-preview">
                    <h3>Collaborative Ledger</h3>
                    <p>Every contribution, considered.</p>
                    <div className="ledger-total">
                      ₹31,04,000<small>settled across both families</small>
                    </div>
                    {[
                      ["Bride’s family", "₹15,52,000"],
                      ["Groom’s family", "₹15,52,000"],
                    ].map(([label, value]) => (
                      <div className="line" key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                    <p className="sage ledger-note">
                      ✓ In harmony. Nothing overlooked.
                    </p>
                  </div>
                </div>
                <div className="demo-note">
                  ILLUSTRATIVE PREVIEW · Your celebration, your way.
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="band">
          <div className="container section">
            <div className="center section-heading">
              <p className="eyebrow sage">
                A LITTLE LESS CHAOS. A LOT MORE CLARITY.
              </p>
              <h2>
                A celebration this meaningful
                <br />
                deserves a calmer way to plan.
              </h2>
            </div>
            <div className="two-columns">
              <div className="comparison">
                <span className="eyebrow">THE FAMILIAR WAY</span>
                <h3>Too many channels. Too many loose ends.</h3>
                <p>
                  Guest lists in spreadsheets. Budgets in notebooks. Important
                  details lost in family chats. It is a lot to hold together.
                </p>
              </div>
              <div className="comparison unified">
                <span className="eyebrow sage">THE TOGETHER WAY</span>
                <h3>One shared space. A collective exhale.</h3>
                <p>
                  Bring your people, plans, and priorities together. Give
                  everyone the clarity to help, and yourselves the space to
                  enjoy it.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="container section" id="interactive-showcase">
          <div className="section-heading" id="ledger">
            <p className="eyebrow sage">A PLACE FOR EVERY DETAIL</p>
            <h2>
              Beautifully simple.
              <br />
              Thoughtfully connected.
            </h2>
            <p>
              Take a look inside your shared planning space. Sample data, real
              possibilities.
            </p>
          </div>
          <div role="tablist" aria-label="Platform previews" className="tabs">
            {tabs.map((name, i) => (
              <button
                key={name}
                id={`tab-${i}`}
                role="tab"
                aria-selected={tab === i}
                aria-controls="showcase-panel"
                tabIndex={tab === i ? 0 : -1}
                onClick={() => setTab(i)}
                onKeyDown={(e) => {
                  if (
                    ["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)
                  ) {
                    e.preventDefault();
                    const next =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? 3
                          : (tab + (e.key === "ArrowRight" ? 1 : 3)) % 4;
                    setTab(next);
                    document.getElementById(`tab-${next}`)?.focus();
                  }
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <div
            className="showcase panel"
            id="showcase-panel"
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            tabIndex={0}
          >
            <div className="panel-heading">
              <div>
                <p className="eyebrow sage">YOUR SHARED WORKSPACE</p>
                <h3>
                  {
                    [
                      "Collaborative Budget & Ledger",
                      "Your Celebration, in Sequence",
                      "Every Guest, Thoughtfully Welcomed",
                      "Many Hands. One Beautiful Plan.",
                    ][tab]
                  }
                </h3>
              </div>
              <span className="tag">SAMPLE PREVIEW</span>
            </div>
            {tab === 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Vendor / Category</th>
                      <th>Committed</th>
                      <th>Paid</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        "Royal Pavilion · Venue",
                        "₹18,00,000",
                        "₹12,00,000",
                        "Deposit paid",
                      ],
                      [
                        "Marigold Studio · Décor",
                        "₹8,50,000",
                        "₹4,25,000",
                        "In progress",
                      ],
                      [
                        "The Wedding Table · Catering",
                        "₹12,00,000",
                        "₹6,00,000",
                        "Deposit paid",
                      ],
                      [
                        "Light & Stories · Photography",
                        "₹3,50,000",
                        "₹3,50,000",
                        "Settled",
                      ],
                    ].map((row) => (
                      <tr key={row[0]}>
                        {row.map((cell, i) => (
                          <td key={i}>
                            {i === 3 ? (
                              <span className="tag">{cell}</span>
                            ) : (
                              cell
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : tab === 1 ? (
              <EventList />
            ) : (
              <div className="sample-list">
                {(tab === 2
                  ? [
                      [
                        "The Singhania Family",
                        "4 guests · Confirmed",
                        "2 rooms reserved",
                      ],
                      [
                        "The Mehta Family",
                        "3 guests · Confirmed",
                        "Vegetarian meals",
                      ],
                      [
                        "The Kapoor Family",
                        "2 guests · Awaiting RSVP",
                        "Travel details pending",
                      ],
                    ]
                  : [
                      [
                        "Welcome guests at the hotel",
                        "Dev & Ritu",
                        "In progress",
                      ],
                      ["Confirm ceremony essentials", "Maasi", "Complete"],
                      ["Review Sangeet playlist", "Aanya & Kabir", "To do"],
                    ]
                ).map(([title, detail, status]) => (
                  <div className="line" key={title}>
                    <div>
                      <strong>{title}</strong>
                      <p>{detail}</p>
                    </div>
                    <span className="tag">{status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        <section className="band" id="workspaces">
          <div className="container section">
            <div className="center section-heading">
              <p className="eyebrow sage">TWO FAMILIES. ONE CELEBRATION.</p>
              <h2>Together, with room to be yourselves.</h2>
              <p>
                A shared vision for the day, with thoughtful spaces for each
                family’s plans.
              </p>
            </div>
            <div className="three-columns">
              {[
                [
                  "01",
                  "Bride Family Workspace",
                  "A dedicated space for your household’s preparations.",
                  "Outfits & appointments",
                  "Family guest arrangements",
                  "Personal planning details",
                ],
                [
                  "◎",
                  "Shared Celebration Core",
                  "The plans that bring everyone together.",
                  "Events & ceremony timelines",
                  "Joint budget & vendors",
                  "Guest invitations & RSVPs",
                ],
                [
                  "02",
                  "Groom Family Workspace",
                  "Your family’s plans, organized with care.",
                  "Baraat & arrival plans",
                  "Family accommodation",
                  "Attire & ceremony essentials",
                ],
              ].map(([number, title, description, ...items], i) => (
                <article
                  className={`workspace-card ${i === 1 ? "featured" : ""}`}
                  key={title}
                >
                  <span className="workspace-number">{number}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <ul>
                    {items.map((item) => (
                      <li key={item}>✓ &nbsp; {item}</li>
                    ))}
                  </ul>
                  <div className="card-caption">
                    {i === 1
                      ? "CONNECTED BY WHAT MATTERS"
                      : "SPACE FOR YOUR FAMILY"}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="container section" id="timeline">
          <div className="section-heading">
            <p className="eyebrow sage">CAPABILITIES</p>
            <h2>Thoughtfully designed for every detail.</h2>
            <p>
              The clarity of a great planning tool. The warmth of a celebration
              made personal.
            </p>
          </div>
          <div className="feature-grid">
            {features.map(([label, title, description, ...notes]) => (
              <article className="feature-card" key={title}>
                <p className="eyebrow">{label}</p>
                <h3>{title}</h3>
                <p>{description}</p>
                <div className="feature-example">
                  {notes.map((note) => (
                    <div key={note}>{note}</div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="band">
          <div className="container section">
            <div className="center section-heading">
              <p className="eyebrow sage">THE PLANNING EXPERIENCE</p>
              <h2>From the first plan to the final celebration.</h2>
            </div>
            <div className="three-columns steps">
              {[
                [
                  "Create your shared space",
                  "Start with the dates, the events, and the people at the heart of your celebration.",
                ],
                [
                  "Bring your families together",
                  "Invite your closest people and give every helping hand a place in the plan.",
                ],
                [
                  "Be present for the moments",
                  "Keep the details organized so you can focus on the memories you are about to make.",
                ],
              ].map(([title, description], i) => (
                <article key={title}>
                  <span>0{i + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section
          className="container section invitation-section"
          id="invitations"
        >
          <div>
            <p className="eyebrow sage">GUEST HOSPITALITY</p>
            <h2>
              Thoughtful for you.
              <br />
              Effortless for your guests.
            </h2>
            <p className="lead">
              A warm welcome starts before the wedding. Bring invitations, event
              details, and guest responses into one considered experience.
            </p>
            <div className="faqs">
              {[
                [
                  "Can both families plan together?",
                  "That is the idea. Shared celebration plans and dedicated family workspaces keep everyone connected while giving each household room to organize.",
                ],
                [
                  "Can we plan a wedding with multiple events?",
                  "Yes. The planned workspace brings ceremonies, timelines, guests, and tasks together across your wedding celebrations.",
                ],
                [
                  "Is the platform ready to use?",
                  "You are viewing our homepage and interactive product preview. Account creation and wedding management are in development.",
                ],
              ].map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="phone">
            <div className="phone-screen">
              <p className="eyebrow sage">INVITATION TO CELEBRATE</p>
              <div className="invitation-monogram">
                A <i>&</i> K
              </div>
              <h3>Aanya & Kabir</h3>
              <p>November 14–16 · Jaipur</p>
              <div className="invitation-rule" />
              <p className="eyebrow">WITH OUR FAMILIES</p>
              <p>
                We invite you to join us
                <br />
                for a lifetime’s beginning.
              </p>
              <div className="invitation-date">
                14 <span>NOVEMBER</span>
              </div>
              <span className="button invitation-rsvp">
                Joyfully celebrating together
              </span>
              <p className="micro">Invitation design preview</p>
            </div>
          </div>
        </section>
        <section className="closing" id="begin">
          <div className="container center">
            <p className="eyebrow">YOUR NEXT CHAPTER</p>
            <h2>The celebration begins with a plan.</h2>
            <p>
              Bring every detail and everyone who matters into one beautiful
              planning experience.
            </p>
            <button className="button" onClick={() => setPreview(true)}>
              Start Planning Today <span aria-hidden="true">↗</span>
            </button>
            <p className="micro">
              Thoughtfully made for you and your families.
            </p>
          </div>
        </section>
      </main>
      <footer>
        <div className="container footer-content">
          <div>
            <a href="#overview" className="wordmark">
              Make My Marriage
            </a>
            <p>
              © {new Date().getFullYear()} Make My Marriage. The art of planning
              together.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <a href="#workspaces">Workspaces</a>
            <a href="#ledger">Budget Ledger</a>
            <a href="#invitations">Invitations</a>
          </nav>
        </div>
      </footer>
      {preview && (
        <dialog
          ref={(node) => {
            if (node && !node.open) node.showModal();
          }}
          onCancel={() => setPreview(false)}
          className="preview-dialog"
          aria-labelledby="preview-title"
          onKeyDown={(e) => {
            if (e.key === "Escape") setPreview(false);
          }}
        >
          <button
            autoFocus
            className="dialog-close"
            aria-label="Close preview"
            onClick={() => setPreview(false)}
          >
            ×
          </button>
          <p className="eyebrow sage">A BEAUTIFUL BEGINNING</p>
          <h2 id="preview-title">Your planning space is on its way.</h2>
          <p>
            We’re building the tools to bring your celebration together. For
            now, explore the interactive preview of what’s coming.
          </p>
          <a
            className="button"
            href="#interactive-showcase"
            onClick={() => setPreview(false)}
          >
            Explore the Preview →
          </a>
        </dialog>
      )}
    </>
  );
}

function EventList() {
  return (
    <div className="event-list">
      {events.map(([name, date, owner]) => (
        <div className="event" key={name}>
          <span className="event-dot" />
          <div>
            <strong>{name}</strong>
            <p>{date}</p>
          </div>
          <span className="tag">{owner}</span>
        </div>
      ))}
    </div>
  );
}
