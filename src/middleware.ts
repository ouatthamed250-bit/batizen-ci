import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Protection stricte de toutes les routes admin
  if (path.startsWith('/admin')) {
    const isAdminVerified = request.cookies.get('batizen_admin')?.value === '1';
    const userRole = request.cookies.get('user_role')?.value;
    
    // Bloquer si pas de cookie de vérification OU si le rôle n'est pas admin
    if (!isAdminVerified || userRole !== 'admin') {
      // Rediriger vers la page de connexion secrète
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', 'admin');
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
