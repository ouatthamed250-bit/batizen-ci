import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * API Route : POST /api/auth/register
 *
 * Crée un nouvel utilisateur via Firebase Admin SDK.
 * Utile pour l'inscription côté serveur (admin back-office).
 *
 * Body (JSON) : {
 *   email: string,
 *   password: string,
 *   displayName?: string,
 *   role?: 'client' | 'admin'  // Par défaut 'client'
 * }
 *
 * Retourne :
 *   { success: true, uid: string } — l'UID du nouvel utilisateur
 *   { error: '...' } avec status 400/409/500 en cas d'échec
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, role } = await request.json();

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

    // 3. Création de l'utilisateur
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
      console.error('❌ Erreur création utilisateur:', createError.message);
      return NextResponse.json(
        { error: `Erreur lors de la création du compte : ${createError.message}` },
        { status: 500 }
      );
    }

    const uid = userRecord.uid;

    // 4. Si le rôle demandé est 'admin', attribuer le custom claim
    const requestedRole = role === 'admin' ? 'admin' : 'client';

    if (requestedRole === 'admin') {
      try {
        await adminAuth.setCustomUserClaims(uid, { role: 'admin' });
        console.log(`✅ Custom claim { role: 'admin' } attribué à ${uid}`);
      } catch (claimsError: any) {
        // On ne bloque pas la création si les claims échouent, mais on log
        console.error(`⚠️ Erreur attribution custom claims à ${uid}:`, claimsError.message);
      }
    }

    console.log(`✅ Utilisateur créé : ${email} (UID: ${uid}, Rôle: ${requestedRole})`);

    return NextResponse.json({
      success: true,
      uid,
      email,
      role: requestedRole,
    });

  } catch (error: any) {
    console.error('❌ Erreur /api/auth/register:', error.message);
    return NextResponse.json(
      { error: 'Erreur de serveur. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}