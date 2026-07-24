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
    console.log('🔵 [create-session] Appel reçu');

    let body: { idToken?: string };
    try {
      body = await request.json();
      console.log('🔵 [create-session] Body parsé avec succès, idToken présent:', !!body.idToken);
    } catch {
      console.warn('🔵 [create-session] Body JSON invalide');
      return NextResponse.json(
        { error: 'Requête invalide. Le corps doit être du JSON.' },
        { status: 400 }
      );
    }

    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      console.warn('🔵 [create-session] idToken manquant ou invalide');
      return NextResponse.json(
        { error: 'idToken requis.' },
        { status: 400 }
      );
    }

    // Initialiser Firebase Admin de manière résiliente
    console.log('🔵 [create-session] Initialisation Firebase Admin...');
    const adminApp = initFirebaseAdmin();
    console.log('🔵 [create-session] Admin app initialisé:', !!adminApp);

    if (!adminApp) {
      console.error('🔴 [create-session] Firebase Admin non initialisé');
      return NextResponse.json(
        { error: 'Configuration serveur invalide.' },
        { status: 500 }
      );
    }

    const auth = getAuth(adminApp);

    // Vérifier que l'idToken est valide
    try {
      console.log('🔵 [create-session] Vérification idToken...');
      const decoded = await auth.verifyIdToken(idToken);
      console.log('🔵 [create-session] idToken valide pour uid:', decoded.uid);
    } catch (verifyError: any) {
      console.error('🔴 [create-session] idToken invalide:', verifyError?.code || verifyError?.message || verifyError);
      return NextResponse.json(
        { error: 'Token invalide ou expiré.' },
        { status: 401 }
      );
    }

    // Créer un session cookie (valable 5 jours)
    const expiresInMs = 5 * 24 * 60 * 60 * 1000; // 5 jours en ms
    const expiresInSec = 5 * 24 * 60 * 60; // 5 jours en secondes
    console.log('🔵 [create-session] Création du session cookie...');
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: expiresInMs });
    console.log('🔵 [create-session] Session cookie créé, longueur:', sessionCookie?.length);

    // Poser le cookie HttpOnly
    const response = NextResponse.json({ success: true, cookieCreated: true });
    response.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiresInSec,
    });

    console.log('🔵 [create-session] Cookie __session posé avec succès');
    return response;

  } catch (error: any) {
    console.error('🔴 [create-session] Erreur non gérée:', error?.message || error);
    if (error?.stack) console.error('🔴 Stack:', error.stack);
    return NextResponse.json(
      { error: 'Erreur de serveur.' },
      { status: 500 }
    );
  }
}