import { NextRequest, NextResponse } from 'next/server';

// Routes by subdomain so this same codebase can serve all three panels,
// either from one deployment (admin./app. subdomains on one Vercel project)
// or from three separate Vercel projects that share this repo/branch — each
// pinned to a single panel via the APP_PANEL env var (set to "founder" or
// "company" in that project's Environment Variables; leave unset for the
// marketing project, which defaults to marketing). Host-based detection
// always wins over APP_PANEL, so attaching real admin./app. domains later
// works without any further code change.
//
// A path that already starts with /founder or /company is routed there
// regardless of host or APP_PANEL: this makes internal links (e.g.
// FounderNav -> "/founder") and anyone navigating to /founder/login or
// /company/login directly work on any of the three deployments.
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
  } else if (process.env.APP_PANEL === 'founder' || process.env.APP_PANEL === 'company') {
    target = process.env.APP_PANEL;
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
