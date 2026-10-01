'use client';

import { useRouter } from 'next/navigation';

export default function LogoutLink() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/company/logout', { method: 'POST' });
    router.push('/company/login');
    router.refresh();
  }

  return (
    <button type="button" className="secondary" onClick={logout}>
      Log out instead
    </button>
  );
}
