import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

/**
 * API Route : POST /api/auth/create-session
 *
 * Crée un session cookie HttpOnly à partir d'un idToken Firebase.
 * Cette route est appelée APRÈS une connexion réussie (email/password ou Google).
 *
 * Le cookie __session permet au middleware de vérifier l'authentification
 * côté serveur sans exposer le token au JavaScript client.
 *
 * Body : { idToken: string }
 *
 * Retourne :
 *   200 : { success: true }
 *   400 : { error: '...' } si idToken manquant
 *   401 : { error: '...' } si idToken invalide
 *   500 : { error: '...' } si erreur serveur
 */
export async function POST(request: NextRequest) {
  try {
    let body: { idToken?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Requête invalide. Le corps doit être du JSON.' },
        { status: 400 }
      );
    }

    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'idToken requis.' },
        { status: 400 }
      );
    }

    // Vérifier que l'idToken est valide
    try {
      await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { error: 'Token invalide ou expiré.' },
        { status: 401 }
      );
    }

    // Créer un session cookie (valable 24h)
    const expiresIn = 24 * 60 * 60 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Poser le cookie HttpOnly
    const response = NextResponse.json({ success: true });
    response.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn / 1000,
    });

    return response;

  } catch (error: any) {
    console.error('❌ Erreur /api/auth/create-session:', error?.message || error);
    return NextResponse.json(
      { error: 'Erreur de serveur.' },
      { status: 500 }
    );
  }
}