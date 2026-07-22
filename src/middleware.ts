import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionCookie } from '@/lib/firebase-admin';

/**
 * Middleware Next.js - Protection des routes admin
 *
 * 🔒 SÉCURITÉ : Le middleware vérifie désormais RÉELLEMENT la validité du cookie
 * de session (__session) et le rôle admin (custom claim), via l'Admin SDK
 * Firebase (verifySessionCookie). Auparavant, seule la PRÉSENCE du cookie était
 * vérifiée : un cookie expiré, révoqué, ou falsifié (valeur non-vide quelconque)
 * suffisait à passer ce filtre, laissant la vérification réelle uniquement au
 * rendu client (facilement contournable).
 *
 * Nécessite `runtime: 'nodejs'` car firebase-admin utilise des API Node.js
 * non disponibles dans le runtime Edge.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('__session')?.value;

    const isValidAdmin = await verifySessionCookie(sessionCookie);

    if (!isValidAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', 'admin');
      const response = NextResponse.redirect(url);
      // Nettoie un éventuel cookie invalide/expiré
      response.cookies.set('__session', '', { path: '/', maxAge: 0 });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
  runtime: 'nodejs',
};
