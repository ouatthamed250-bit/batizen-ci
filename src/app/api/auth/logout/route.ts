import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * API Route : POST /api/auth/logout
 *
 * Supprime le cookie de session HttpOnly (__session) côté serveur ET révoque
 * réellement les tokens de l'utilisateur via Firebase Admin SDK.
 *
 * Sans l'appel à revokeRefreshTokens(), effacer le cookie ne protège que le
 * navigateur qui fait la demande de déconnexion. Une copie du même cookie
 * (poste partagé, session interceptée, navigateur synchronisé) resterait
 * valide jusqu'à son expiration naturelle (24h), même après "déconnexion" —
 * la vérification de révocation dans verifySessionCookie(cookie, true) ne
 * sert à rien tant qu'aucune révocation n'a réellement eu lieu.
 */
export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value;

  if (sessionCookie) {
    try {
      // checkRevoked: false ici volontairement — on veut décoder le cookie
      // même s'il est déjà expiré/révoqué, juste pour récupérer l'uid et
      // s'assurer que la révocation est bien (re)déclenchée.
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
      await adminAuth.revokeRefreshTokens(decoded.uid);
    } catch {
      // Cookie déjà invalide/expiré/malformé : rien à révoquer, on continue
      // simplement pour nettoyer le cookie côté navigateur.
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('__session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}