import { redirect } from 'next/navigation';

// Only reached if middleware didn't already rewrite the host to /founder, /company,
// or /marketing (e.g. an unrecognized host hits the apex route directly).
export default function RootPage() {
  redirect('/marketing');
}
