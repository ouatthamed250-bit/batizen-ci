import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware Next.js — Protection des routes /admin/*
 *
 * 🔒 Vérifie UNIQUEMENT la présence du cookie __session.
 *     La vraie vérification des droits admin (custom claim + fallback DB)
 *     est déléguée au Server Component admin/layout.tsx, car firebase-admin
 *     ne peut pas être importé dans le middleware (conflit ESM/CJS avec
 *     jose/jwks-rsa sur l'environnement serverless Vercel).
 *
 * À partir de Next.js 16, le fichier "middleware.ts" est déprécié au profit
 * de "proxy". Voir https://nextjs.org/docs/messages/middleware-to-proxy
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('__session')?.value;

    // Pas de cookie du tout → pas connecté → redirection vers login
    if (!sessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', 'admin');
      const response = NextResponse.redirect(url);
      // Nettoie un éventuel cookie invalide/expiré
      response.cookies.set('__session', '', { path: '/', maxAge: 0 });
      return response;
    }

    // Cookie présent → la vérification admin est faite dans le layout Server Component
    // (src/app/admin/layout.tsx) qui utilise firebase-admin via next/headers + verifySessionCookie()
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};