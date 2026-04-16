import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'sp_auth';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect dashboard routes
  if (!pathname.startsWith('/dashboard')) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const expected = process.env.AUTH_TOKEN;

  if (!expected || token !== expected) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
