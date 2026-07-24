import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionCookie } from '@/lib/firebase-admin';
import AdminLayoutClient from './AdminLayoutClient';

/**
 * Layout admin — Server Component
 *
 * 🔒 Vérification stricte côté serveur que l'utilisateur possède un cookie de session
 *     valide avec le custom claim "admin". Cette approche contourne le problème
 *     ESM/CJS de firebase-admin (via jose/jwks-rsa) dans le middleware Next.js
 *     car ce Layout s'exécute dans un Route Handler standard où serverExternalPackages
 *     s'applique correctement.
 *
 * Double sécurité :
 *   1. Custom claim Firebase (via verifySessionCookie) — PRIORITAIRE
 *   2. Fallback Realtime Database (users/{uid}/role) — intégré dans verifySessionCookie
 *      (voir src/lib/firebase-admin.ts → fonction verifySessionCookie)
 *
 * ⚠️ Try/catch global : si firebase-admin n'est pas initialisé (variables d'env
 *     manquantes sur Vercel), on redirige vers /login au lieu de planter en 500.
 *
 * ⚠️ force-dynamic : obligatoire car ce layout utilise cookies() (Server Component).
 *     Sans cette directive, Next.js tente de rendre les pages /admin/* statiquement
 *     et échoue avec "couldn't be rendered statically because it used cookies".
 */
export const dynamic = 'force-dynamic';

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

    // Vérification réelle du cookie de session via Firebase Admin
    const isValidAdmin = await verifySessionCookie(sessionCookie);

    if (!isValidAdmin) {
      // Session invalide ou utilisateur non admin → redirection
      redirect('/login?redirect=admin');
    }

    // Utilisateur admin authentifié → afficher l'interface
    return <AdminLayoutClient>{children}</AdminLayoutClient>;

  } catch (error) {
    // 🔒 Si firebase-admin n'est pas disponible ou si une erreur survient,
    // on redirige vers /login au lieu de retourner une page d'erreur HTML 500.
    console.error('❌ AdminLayout error:', error);
    redirect('/login?redirect=admin');
  }
}