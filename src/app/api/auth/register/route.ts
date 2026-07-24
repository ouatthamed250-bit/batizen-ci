import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

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
    let body: { email?: string; password?: string; displayName?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Requête invalide. Le corps doit être du JSON.' },
        { status: 400 }
      );
    }

    const { email, password, displayName } = body;

    // 1. Validation des champs requis
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Le champ "email" est requis et doit être une chaîne de caractères.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Le champ "password" est requis et doit être une chaîne de caractères.' },
        { status: 400 }
      );
    }

    // 2. Validation de la longueur du mot de passe (Firebase require 6+ caractères)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères.' },
        { status: 400 }
      );
    }

    // 3. Création de l'utilisateur — toujours avec le rôle 'client'
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