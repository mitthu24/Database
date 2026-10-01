import RequestAccessForm from './request-access-form';

const FEATURES = [
  {
    title: 'Your own data tables',
    body: 'Create named tables with typed columns for visits, sales, inventory, or anything else you track — no SQL required.',
  },
  {
    title: 'CSV in, CSV out',
    body: 'Append new rows, replace a table\'s data entirely, or export everything to CSV in a couple of clicks.',
  },
  {
    title: 'Role-based team access',
    body: 'Company Admin, Data Manager, Data Analyst, Data Entry — each role sees and can do exactly what it should, down to individual tables.',
  },
];

export default function MarketingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <header className="row" style={{ justifyContent: 'space-between', padding: '20px 36px' }}>
        <strong>Database SaaS</strong>
        <a className="btn secondary" href="/company/login">
          Sign in
        </a>
      </header>

      <section style={{ textAlign: 'center', padding: '60px 24px 40px' }}>
        <h1 style={{ fontSize: 34, margin: '0 0 12px' }}>
          A simple database platform for your business
        </h1>
        <p className="muted" style={{ fontSize: 16, maxWidth: 560, margin: '0 auto 28px' }}>
          Give your team a shared place to create tables, upload and manage data, and export it
          back out — with the right people seeing only what they should.
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
          maxWidth: 960,
          margin: '0 auto 50px',
          padding: '0 24px',
        }}
      >
        {FEATURES.map((f) => (
          <div className="card" key={f.title} style={{ margin: 0 }}>
            <h2 style={{ fontSize: 16 }}>{f.title}</h2>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              {f.body}
            </p>
          </div>
        ))}
      </section>

      <section style={{ display: 'flex', justifyContent: 'center', padding: '0 24px 60px' }}>
        <RequestAccessForm />
      </section>

      <footer className="muted" style={{ textAlign: 'center', padding: '20px 24px', fontSize: 12 }}>
        Already have an account? <a href="/company/login">Company sign in</a> ·{' '}
        <a href="/founder/login">Founder sign in</a>
      </footer>
    </div>
  );
}
