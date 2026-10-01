import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Database SaaS',
  description: 'Multi-tenant data ingestion platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
