import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware Next.js — Protection des routes /admin/*
 *
 * 🔒 Deux niveaux de vérification :
 *   1. Custom claim Firebase (via session cookie) — PRIORITAIRE
 *   2. Fallback Realtime Database (users/{uid}/role) — FALLBACK
 *      Utile pour les admins créés via AdminSecretModal qui n'ont que
 *      le rôle "admin" dans la DB mais pas encore de custom claim.
 *
 * ⚠️ Imports dynamiques pour que firebase-admin ne soit chargé QUE si
 *     un cookie de session est présent. Si l'initialisation échoue
 *     (variables d'env manquantes sur Vercel, conflit ESM), le middleware
 *     attrape l'erreur et redirige vers /login sans crash.
 *
 * À partir de Next.js 16, le fichier "middleware.ts" est déprécié au profit
 * de "proxy". Voir https://nextjs.org/docs/messages/middleware-to-proxy
 */
export async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;

    if (path.startsWith('/admin')) {
      const sessionCookie = request.cookies.get('__session')?.value;

      // Pas de cookie du tout → pas connecté → redirection vers login
      if (!sessionCookie) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', 'admin');
        const response = NextResponse.redirect(url);
        response.cookies.set('__session', '', { path: '/', maxAge: 0 });
        return response;
      }

      // ── 1. Vérification par custom claim (rapide, prioritaire) ──
      let isValidAdmin = false;
      try {
        const { adminAuth } = await import('@/lib/firebase-admin');
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        isValidAdmin = decodedClaims.role === 'admin';
      } catch {
        // Cookie invalide/expiré ou firebase-admin pas encore initialisé
        // → on continue vers le fallback DB
      }

      // ── 2. Fallback Realtime Database (si custom claim échoue) ──
      // Utile pour les admins créés via AdminSecretModal qui n'ont que
      // le rôle "admin" dans la DB mais pas encore de custom claim.
      if (!isValidAdmin) {
        try {
          const { firebaseAdmin } = await import('@/lib/firebase-admin');
          if (firebaseAdmin) {
            const { getAuth } = await import('firebase-admin/auth');
            const { getDatabase } = await import('firebase-admin/database');

            const fallbackAuth = getAuth(firebaseAdmin);
            const decodedToken = await fallbackAuth.verifySessionCookie(sessionCookie, true);
            const uid = decodedToken.uid;

            const adminDb = getDatabase(firebaseAdmin);
            const snapshot = await adminDb.ref(`users/${uid}/role`).once('value');

            if (snapshot.val() === 'admin') {
              isValidAdmin = true;
              console.log(`✅ Middleware DB fallback : admin via DB (uid: ${uid})`);
            }
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
        response.cookies.set('__session', '', { path: '/', maxAge: 0 });
        return response;
      }
    }

    return NextResponse.next();

  } catch (error) {
    // 🔒 Try/catch GLOBAL : si firebase-admin crash (variables d'env manquantes
    // sur Vercel, conflit ESM/CJS, etc.), on redirige vers /login au lieu de
    // retourner une page d'erreur HTML 500.
    console.error('❌ Middleware global error:', error);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};