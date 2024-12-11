import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// Debug logger
const debug = {
  log: (...args: any[]) => console.log(" [Middleware]", ...args),
  error: (...args: any[]) => console.error(" [Middleware]", ...args),
};

// List of public paths that don't require authentication
const publicPaths = ['/auth/signin', '/auth/signup', '/api/auth'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  debug.log(`Checking path: ${pathname}`);

  // Check if the path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // Get the token using the NEXTAUTH_SECRET from your environment
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  debug.log(`Path: ${pathname}, Public: ${isPublicPath}, Authenticated: ${!!token}`);

  // If not authenticated and trying to access non-public path, redirect to signin
  if (!token && !isPublicPath) {
    debug.log(`Blocking access to ${pathname} - redirecting to signin`);
    const signInPage = new URL("/auth/signin", request.url);
    return NextResponse.redirect(signInPage);
  }

  // Allow the request to proceed
  debug.log(`Allowing access to: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and api routes
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
