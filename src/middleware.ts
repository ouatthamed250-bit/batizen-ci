import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth, firebaseAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

/**
 * Middleware Next.js — Protection des routes /admin/*
 *
 * 🔒 Deux niveaux de vérification :
 *   1. Custom claim Firebase (via session cookie) — PRIORITAIRE
 *   2. Fallback Realtime Database (users/{uid}/role) — FALLBACK
 *      Utile pour les admins créés via AdminSecretModal qui n'ont que
 *      le rôle "admin" dans la DB mais pas encore de custom claim.
 *
 * Nécessite `runtime: 'nodejs'` car firebase-admin utilise des API Node.js.
 * (serverExternalPackages ne s'applique pas au middleware, donc on force
 *  le runtime Node.js pour éviter le conflit ESM/CJS avec jose/jwks-rsa.)
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

    // ── 1. Vérification par custom claim (rapide, prioritaire) ──
    let isValidAdmin = false;
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      isValidAdmin = decodedClaims.role === 'admin';
    } catch {
      // Cookie invalide/expiré → on continue vers le fallback DB
    }

    // ── 2. Fallback Realtime Database (si custom claim échoue) ──
    // Utile pour les admins créés via AdminSecretModal qui n'ont que
    // le rôle "admin" dans la DB mais pas encore de custom claim.
    if (!isValidAdmin && sessionCookie) {
      try {
        // Décoder le cookie pour récupérer l'UID
        const fallbackAuth = getAuth(firebaseAdmin);
        const decodedToken = await fallbackAuth.verifySessionCookie(sessionCookie, true);
        const uid = decodedToken.uid;

        const adminDb = getDatabase(firebaseAdmin);
        const snapshot = await adminDb.ref(`users/${uid}/role`).once('value');

        if (snapshot.val() === 'admin') {
          isValidAdmin = true;
          console.log(`✅ Middleware DB fallback : admin via DB (uid: ${uid})`);
        }
      } catch {
        // Échec silencieux : on garde isValidAdmin = false
      }
    }

    // ── Redirection si non admin ──
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