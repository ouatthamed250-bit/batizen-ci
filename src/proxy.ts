import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy Next.js 16 — Protection des routes /admin/*
 * 
 * Vérifie la présence du cookie de session Firebase (__session).
 * Si absent → redirect vers /login
 * Si présent → laisse passer (la vérification du rôle admin se fait côté client dans admin/layout.tsx)
 */
export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value;

  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};