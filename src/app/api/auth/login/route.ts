import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'sp_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const correct = process.env.DASHBOARD_PASSWORD;
  const token = process.env.AUTH_TOKEN;

  if (!correct || !token) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
  }

  if (password !== correct) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  return res;
}
