import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * Durée de validité du session cookie (5 jours par défaut).
 * Peut être surchargée via la variable d'environnement SESSION_EXPIRY_MS.
 */
const SESSION_EXPIRY_MS = process.env.SESSION_EXPIRY_MS
  ? parseInt(process.env.SESSION_EXPIRY_MS, 10)
  : 5 * 24 * 60 * 60 * 1000; // 5 jours

/**
 * API Route : POST /api/auth/login
 *
 * Crée un session cookie HttpOnly à partir d'un idToken Firebase.
 * Ce cookie est ensuite utilisé par le middleware pour protéger les routes /admin.
 *
 * Body (JSON) : { idToken: string }
 *
 * Retourne :
 *   { success: true, user: { uid, email, role } } — avec cookie __session
 *   { error: '...' } avec status 400/401/500 en cas d'échec
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'Requête invalide. Le champ "idToken" est requis.' },
        { status: 400 }
      );
    }

    // 1. Vérifier et décoder l'idToken
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (tokenError: any) {
      if (tokenError.code === 'auth/id-token-expired') {
        return NextResponse.json(
          { error: 'Token expiré. Veuillez vous reconnecter.' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: 'Token invalide.' },
        { status: 401 }
      );
    }

    const { uid, email, role } = decodedToken;

    // 2. Créer un session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRY_MS,
    });

    // 3. Poser le cookie HttpOnly — lu uniquement côté serveur
    const response = NextResponse.json({
      success: true,
      user: {
        uid,
        email: email || null,
        role: role || 'client',
      },
    });

    response.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: Math.floor(SESSION_EXPIRY_MS / 1000), // en secondes
    });

    return response;

  } catch (error: any) {
    console.error('❌ Erreur /api/auth/login:', error.message);
    return NextResponse.json(
      { error: 'Erreur de serveur. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}