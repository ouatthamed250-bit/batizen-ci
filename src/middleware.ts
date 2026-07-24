import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { verifySessionCookie, firebaseAdmin } from '@/lib/firebase-admin';

/**
 * Middleware Next.js — Protection des routes /admin/*
 *
 * 🔒 Deux niveaux de vérification :
 *   1. Custom claim Firebase (via session cookie) — PRIORITAIRE
 *   2. Fallback Realtime Database (users/{uid}/role) — FALLBACK
 *      (utile si le custom claim n'a pas encore été propagé)
 *
 * Nécessite `runtime: 'nodejs'` car firebase-admin utilise des API Node.js.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('__session')?.value;

    // ── 1. Vérification par custom claim (rapide, prioritaire) ──
    let isValidAdmin = await verifySessionCookie(sessionCookie);

    // ── 2. Fallback Realtime Database (si custom claim échoue) ──
    // Utile pour les admins créés via /make-me-admin qui n'ont que
    // le rôle "admin" dans la DB mais pas encore de custom claim.
    if (!isValidAdmin && sessionCookie) {
      try {
        const adminAuth = getAuth(firebaseAdmin);
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
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
