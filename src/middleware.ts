import { NextRequest, NextResponse } from 'next/server';

// Routes by subdomain so one Next.js app/deploy serves all three domains:
//   admin.<root>  -> /founder/*   (founder / super-admin panel)
//   app.<root>    -> /company/*   (company admin + staff panel)
//   <root> (apex) -> /marketing/* (placeholder landing page, built in Phase 3)
//
// A path that already starts with /founder or /company is routed there
// regardless of host: this makes internal links (e.g. FounderNav -> "/founder")
// and anyone navigating to /founder/login or /company/login directly work even
// without real subdomains set up yet (e.g. testing on the raw *.vercel.app
// URL before a custom domain is attached). Only a path with neither prefix
// (including bare "/") falls back to the host-based rule, which is marketing
// unless the host is an admin./app. subdomain.
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get('host') || '';
  const hostname = host.split(':')[0];

  if (url.pathname.startsWith('/api')) {
    // API routes are shared; don't rewrite them.
    return NextResponse.next();
  }

  if (url.pathname.startsWith('/founder') || url.pathname.startsWith('/company')) {
    return NextResponse.next();
  }

  let target: 'founder' | 'company' | 'marketing' = 'marketing';
  if (hostname.startsWith('admin.')) {
    target = 'founder';
  } else if (hostname.startsWith('app.')) {
    target = 'company';
  }

  if (url.pathname.startsWith('/marketing')) {
    return NextResponse.next();
  }

  const rewritten = url.clone();
  rewritten.pathname = `/${target}${url.pathname === '/' ? '' : url.pathname}`;
  return NextResponse.rewrite(rewritten);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
