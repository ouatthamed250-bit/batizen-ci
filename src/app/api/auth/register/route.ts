import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getFirebaseAdminAuth } from '@/lib/firebase-admin';
import { registerSchema } from '@/lib/validation';

export const runtime = 'nodejs';

/**
 * API Route : POST /api/auth/register
 *
 * Crée un nouvel utilisateur via Firebase Admin SDK.
 * Cette route crée UNIQUEMENT des comptes avec le rôle 'client'.
 *
 * ⚠️ SÉCURITÉ : Il est IMPOSSIBLE de créer un compte admin via cette route.
 * Le rôle 'admin' ne peut être attribué QUE via le script serveur :
 *   node scripts/set-admin-role.js <UID>
 *
 * Body (JSON) : {
 *   email: string,
 *   password: string,
 *   displayName?: string
 * }
 *
 * Retourne :
 *   { success: true, uid: string } — l'UID du nouvel utilisateur
 *   { error: '...' } avec status 400/409/500 en cas d'échec
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { email, password, displayName } = parseResult.data;

    // 1. Création de l'utilisateur — toujours avec le rôle 'client'
    const adminAuth = getFirebaseAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { error: "Service d'inscription indisponible." },
        { status: 503 }
      );
    }

    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: displayName || email.split('@')[0],
        disabled: false,
      });
    } catch (createError: any) {
      if (createError.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { error: 'Un compte avec cet email existe déjà.' },
          { status: 409 }
        );
      }
      console.error('❌ Erreur création utilisateur:', createError?.message || createError);
      return NextResponse.json(
        { error: `Erreur lors de la création du compte : ${createError.message}` },
        { status: 500 }
      );
    }

    const uid = userRecord.uid;
    const role = 'client';

    console.log(`✅ Utilisateur créé : ${email} (UID: ${uid}, Rôle: ${role})`);

    try {
      const { sendAdminNotification } = await import('@/lib/notifications');
      await sendAdminNotification({
        type: 'nouveau_client',
        userId: uid,
        userName: displayName || email.split('@')[0],
        message: `Nouveau client inscrit : ${displayName || email.split('@')[0]}`,
      });
    } catch (notifError) {
      console.error('⚠️ Notification admin non envoyee (inscription reussie quand meme):', notifError);
    }

    try {
      const { sendPushToAllDevices } = await import('@/lib/push-server');
      await sendPushToAllDevices(
        '👤 Nouveau client',
        `${displayName || email.split('@')[0]} vient de s'inscrire`,
        '/admin/clients'
      );
    } catch (pushError) {
      console.error('⚠️ Push admin non envoye (inscription reussie quand meme):', pushError);
    }

    return NextResponse.json({
      success: true,
      uid,
      email,
      role,
    });

  } catch (error: any) {
    console.error('❌ Erreur /api/auth/register:', error?.message || error);
    return NextResponse.json(
      { error: 'Erreur de serveur. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}

/**
 * Route GET non supportée
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Méthode non autorisée. Utilisez POST.' },
    { status: 405 }
  );
}