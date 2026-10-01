'use client';

import { useRouter } from 'next/navigation';

export default function FounderNav({ email }: { email: string }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/founder/logout', { method: 'POST' });
    router.push('/founder/login');
    router.refresh();
  }

  return (
    <nav>
      <a href="/founder">Companies</a>
      <a href="/founder/requests">Requests</a>
      <div className="muted" style={{ marginTop: 20, fontSize: 12 }}>
        {email}
      </div>
      <button className="secondary" style={{ marginTop: 10 }} onClick={logout}>
        Log out
      </button>
    </nav>
  );
}
