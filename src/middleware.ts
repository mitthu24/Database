import { NextRequest, NextResponse } from 'next/server';

// Routes by subdomain so one Next.js app/deploy serves all three domains:
//   admin.<root>  -> /founder/*   (founder / super-admin panel)
//   app.<root>    -> /company/*   (company admin + staff panel)
//   <root> (apex) -> /marketing/* (placeholder landing page, built in Phase 3)
//
// In local dev (no real subdomains), hitting /founder/* or /company/* directly
// works too, and ?panel=founder|company on any path forces a panel for testing.
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get('host') || '';
  const hostname = host.split(':')[0];

  const panelOverride = url.searchParams.get('panel');
  let target: 'founder' | 'company' | 'marketing' | null = null;

  if (panelOverride === 'founder' || panelOverride === 'company') {
    target = panelOverride;
  } else if (hostname.startsWith('admin.')) {
    target = 'founder';
  } else if (hostname.startsWith('app.')) {
    target = 'company';
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Local dev without subdomains: let explicit /founder or /company paths through
    // untouched, otherwise fall back to the marketing placeholder.
    if (url.pathname.startsWith('/founder') || url.pathname.startsWith('/company')) {
      return NextResponse.next();
    }
    target = 'marketing';
  } else {
    target = 'marketing';
  }

  if (
    (target === 'founder' && url.pathname.startsWith('/founder')) ||
    (target === 'company' && url.pathname.startsWith('/company')) ||
    (target === 'marketing' && url.pathname.startsWith('/marketing'))
  ) {
    return NextResponse.next();
  }

  if (url.pathname.startsWith('/api')) {
    // API routes are shared; don't rewrite them.
    return NextResponse.next();
  }

  const rewritten = url.clone();
  rewritten.pathname = `/${target}${url.pathname === '/' ? '' : url.pathname}`;
  return NextResponse.rewrite(rewritten);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
