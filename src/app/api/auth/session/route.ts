import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { timingSafeEqualString } from '@/lib/security';

// Le mot de passe admin DOIT être défini dans .env.local (ADMIN_SECRET_PASSWORD=xxx)
// Aucun fallback en dur : si la variable est absente, l'accès est refusé plutôt
// que de retomber sur un mot de passe par défaut connu.
const ADMIN_SECRET_PASSWORD = process.env.ADMIN_SECRET_PASSWORD;

/**
 * API Route : POST /api/auth/session
 *
 * Reçoit l'idToken Firebase et le mot de passe du client, les vérifie côté serveur,
 * crée un session cookie HttpOnly et le renvoie.
 *
 * Ordre des vérifications (important pour la sécurité) :
 * 1. Identité (idToken valide) — on sait QUI parle
 * 2. Mot de passe admin — on vérifie l'autorisation d'action
 * 3. Rôle admin (custom claim) — on vérifie le droit réel sur ce compte
 *
 * Les messages d'erreur pour les échecs 2 et 3 sont volontairement identiques
 * ("Accès refusé") pour ne pas indiquer à un attaquant lequel des deux a échoué.
 *
 * Body: { idToken: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Config serveur : on échoue fermé si le mot de passe n'est pas configuré
    if (!ADMIN_SECRET_PASSWORD) {
      console.error('ADMIN_SECRET_PASSWORD non configuré dans les variables d\'environnement');
      return NextResponse.json(
        { error: 'Configuration serveur invalide.' },
        { status: 500 }
      );
    }

    const { idToken, password } = await request.json();

    if (!idToken || !password) {
      return NextResponse.json(
        { error: 'Requête invalide.' },
        { status: 400 }
      );
    }

    // 1. Vérifier l'idToken Firebase en premier : authentifier qui fait la demande
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (tokenError: any) {
      if (tokenError.code === 'auth/id-token-expired') {
        return NextResponse.json(
          { error: 'Session expirée. Veuillez vous reconnecter.' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: 'Session invalide.' },
        { status: 401 }
      );
    }
    const uid = decodedToken.uid;

    // 2. Vérifier le mot de passe admin
    // 🔒 Comparaison à temps constant : évite qu'un attaquant devine le mot
    // de passe caractère par caractère en mesurant le temps de réponse.
    if (typeof password !== 'string' || !timingSafeEqualString(password, ADMIN_SECRET_PASSWORD)) {
      return NextResponse.json(
        { error: 'Accès refusé.' },
        { status: 403 }
      );
    }

    // 3. Vérifier que ce compte a bien le rôle admin (custom claim)
    const userRecord = await adminAuth.getUser(uid);
    const customClaims = userRecord.customClaims || {};

    if (customClaims.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé.' },
        { status: 403 }
      );
    }

    // 4. Créer un session cookie (valable 24h)
    const expiresIn = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // 5. Poser le cookie HttpOnly — lu uniquement côté serveur (middleware)
    const response = NextResponse.json({ success: true });
    response.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn / 1000, // maxAge en secondes
    });

    return response;

  } catch (error: any) {
    console.error('Erreur session API:', error);
    return NextResponse.json(
      { error: 'Erreur de serveur. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}