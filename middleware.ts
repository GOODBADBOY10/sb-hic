import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'sb_hic_session';

// This is a UX improvement only — it stops a logged-out admin from briefly
// seeing a page before bouncing to /admin/login. It deliberately does NOT
// verify the JWT (that requires Node's crypto, which isn't reliably
// available in the Edge runtime middleware normally runs in). The actual
// security boundary remains requireRole() in lib/auth.ts, called by every
// admin API route — this just improves what happens before that.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
