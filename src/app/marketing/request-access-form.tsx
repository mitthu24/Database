'use client';

import { useState } from 'react';

export default function RequestAccessForm() {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch('/api/public/request-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, contactName, contactEmail, message: message || undefined }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error || 'Something went wrong. Please try again.');
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="card" style={{ maxWidth: 420 }}>
        <h2>Request received</h2>
        <p className="muted">
          Thanks — we'll review your request and email {contactEmail} with login details once
          approved.
        </p>
      </div>
    );
  }

  return (
    <form className="card" style={{ maxWidth: 420, textAlign: 'left' }} onSubmit={onSubmit}>
      <h2>Request access</h2>
      <div className="field">
        <label>Company name</label>
        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
      </div>
      <div className="field">
        <label>Your name</label>
        <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
      </div>
      <div className="field">
        <label>Work email</label>
        <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
      </div>
      <div className="field">
        <label>What are you looking to track? (optional)</label>
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Request access'}
      </button>
    </form>
  );
}
