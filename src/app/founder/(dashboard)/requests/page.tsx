import { prisma } from '@/lib/db';
import RequestRow from './request-row';

export default async function RequestsPage() {
  const requests = await prisma.companyRequest.findMany({ orderBy: { createdAt: 'desc' } });
  const pending = requests.filter((r) => r.status === 'PENDING');
  const decided = requests.filter((r) => r.status !== 'PENDING');

  return (
    <>
      <div className="card">
        <h2>Pending requests ({pending.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Message</th>
              <th>Requested</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pending.map((r) => (
              <RequestRow key={r.id} request={r} />
            ))}
            {pending.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No pending requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Decided ({decided.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Decided</th>
            </tr>
          </thead>
          <tbody>
            {decided.map((r) => (
              <tr key={r.id}>
                <td>{r.companyName}</td>
                <td className="muted">
                  {r.contactName} &lt;{r.contactEmail}&gt;
                </td>
                <td>
                  <span className="badge">{r.status}</span>
                </td>
                <td className="muted">{r.decidedAt ? r.decidedAt.toISOString().slice(0, 10) : '-'}</td>
              </tr>
            ))}
            {decided.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Nothing decided yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
