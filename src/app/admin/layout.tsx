import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import AdminLayoutClient from './AdminLayoutClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Layout admin — Server Component
 *
 * 🔒 Vérification stricte côté serveur que l'utilisateur possède un cookie de session
 *     valide avec le rôle "admin". Deux niveaux de vérification :
 *
 *   1. Custom claim Firebase (via session cookie) — PRIORITAIRE
 *   2. Fallback Realtime Database (users/{uid}/role) — FALLBACK
 *      Utile pour les admins créés via AdminSecretModal qui n'ont que
 *      le rôle "admin" dans la DB mais pas encore de custom claim.
 *
 * ⚠️ Try/catch global : si firebase-admin n'est pas initialisé (variables d'env
 *     manquantes sur Vercel), on redirige vers /login au lieu de planter en 500.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    // Pas de cookie → pas connecté → redirection
    if (!sessionCookie) {
      redirect('/login?redirect=admin');
    }

    const adminApp = initFirebaseAdmin();

    // Si firebase-admin n'est pas initialisé → on refuse l'accès
    if (!adminApp) {
      console.error('❌ AdminLayout: Firebase Admin non initialisé');
      redirect('/login?redirect=admin');
    }

    // ── 1. Vérification par custom claim (rapide, prioritaire) ──
    const auth = getAuth(adminApp);
    let decodedToken;
    try {
      decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    } catch {
      // Cookie invalide/expiré
      redirect('/login?redirect=admin');
    }

    if (decodedToken.role === 'admin') {
      // Admin via custom claim → OK
      return <AdminLayoutClient>{children}</AdminLayoutClient>;
    }

    // ── 2. Fallback Realtime Database (si custom claim échoue) ──
    try {
      const db = getDatabase(adminApp);
      const snapshot = await db.ref(`users/${decodedToken.uid}/role`).once('value');

      if (snapshot.val() === 'admin') {
        console.log(`✅ AdminLayout DB fallback : admin via DB (uid: ${decodedToken.uid})`);
        return <AdminLayoutClient>{children}</AdminLayoutClient>;
      }
    } catch {
      // Échec silencieux
    }

    // Pas admin du tout → redirection
    redirect('/login?redirect=admin');

  } catch (error) {
    // 🔒 Si une erreur survient (firebase-admin pas dispo, etc.)
    console.error('❌ AdminLayout error:', error);
    redirect('/login?redirect=admin');
  }
}