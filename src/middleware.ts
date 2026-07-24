import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware désactivé — la vérification admin est gérée côté client
 * via useAuth() dans admin/layout.tsx (Client Component).
 *
 * Cette fonction doit exister sinon Next.js plante au build.
 * Elle ne fait rien et laisse passer toutes les requêtes.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};