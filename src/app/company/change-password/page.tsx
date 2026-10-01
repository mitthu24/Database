import { redirect } from 'next/navigation';
import { getCompanySession } from '@/lib/auth';
import ChangePasswordForm from './change-password-form';
import LogoutLink from './logout-link';

export default async function ChangePasswordPage() {
  const session = await getCompanySession();
  if (!session) redirect('/company/login');

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Set a new password</h2>
        <p className="muted">
          You're signed in with a temporary password. Choose a new password to continue.
        </p>
        <ChangePasswordForm />
        <div style={{ marginTop: 12 }}>
          <LogoutLink />
        </div>
      </div>
    </div>
  );
}
