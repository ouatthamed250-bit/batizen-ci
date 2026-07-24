import { NextResponse } from 'next/server';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export const runtime = 'nodejs';

/**
 * API Route : POST /api/auth/create-session
 *
 * Crée un session cookie HttpOnly à partir d'un idToken Firebase.
 * Cette route est appelée APRÈS une connexion réussie (email/password ou Google).
 *
 * Le cookie __session permet au layout admin de vérifier l'authentification
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
export async function POST(request: Request) {
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

    // Initialiser Firebase Admin de manière résiliente
    const adminApp = initFirebaseAdmin();
    if (!adminApp) {
      console.error('❌ create-session: Firebase Admin non initialisé');
      return NextResponse.json(
        { error: 'Configuration serveur invalide.' },
        { status: 500 }
      );
    }

    const auth = getAuth(adminApp);

    // Vérifier que l'idToken est valide
    try {
      await auth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { error: 'Token invalide ou expiré.' },
        { status: 401 }
      );
    }

    // Créer un session cookie (valable 5 jours)
    const expiresInMs = 5 * 24 * 60 * 60 * 1000; // 5 jours en ms
    const expiresInSec = 5 * 24 * 60 * 60; // 5 jours en secondes
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: expiresInMs });

    // Poser le cookie HttpOnly
    const response = NextResponse.json({ success: true });
    response.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiresInSec,
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