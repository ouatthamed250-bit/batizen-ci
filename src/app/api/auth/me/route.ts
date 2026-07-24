import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

/**
 * API Route : GET /api/auth/me
 *
 * Vérifie la validité du session cookie et retourne les informations
 * de l'utilisateur connecté. Cette route est utilisée côté client pour
 * restaurer la session au démarrage (hydratation).
 *
 * Cookie requis : __session (HttpOnly, posé par POST /api/auth/session)
 *
 * Retourne :
 *   200 : { user: { uid, email, role } }
 *   401 : { error: 'Non authentifié.' }
 */
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Non authentifié. Aucune session trouvée.' },
        { status: 401 }
      );
    }

    // Vérifier le cookie de session (checkRevoked: true pour invalider
    // les sessions dont les refresh tokens ont été révoqués, ex: logout)
    let decodedClaims;
    try {
      decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch (verifyError: any) {
      // Cookie invalide, expiré ou révoqué
      const response = NextResponse.json(
        { error: 'Session invalide ou expirée.' },
        { status: 401 }
      );
      // Nettoyer le cookie invalide
      response.cookies.set('__session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      });
      return response;
    }

    const { uid, email, role } = decodedClaims;

    return NextResponse.json({
      user: {
        uid,
        email: email || null,
        role: role || 'client',
      },
    });

  } catch (error: any) {
    console.error('❌ Erreur /api/auth/me:', error?.message || error);
    return NextResponse.json(
      { error: 'Erreur de serveur.' },
      { status: 500 }
    );
  }
}

/**
 * Route POST non supportée
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Méthode non autorisée. Utilisez GET.' },
    { status: 405 }
  );
}