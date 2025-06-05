import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define routes that are explicitly public
const isPublicRoute = createRouteMatcher([
  '/',                // Landing page
  '/pricing',         // Pricing page
  '/terms',           // Terms page
  '/privacy',         // Privacy page
  '/sign-in(.*)',     // Sign-in and its sub-routes
  '/sign-up(.*)',     // Sign-up and its sub-routes
  '/api/paypal/webhook' // PayPal webhook endpoint (must be public)
  // Add any other specific public API routes or pages here
]);

export default clerkMiddleware((auth, req) => {
  // If it's not a public route, protect it.
  // auth.protect() will automatically handle unauthenticated users
  // (e.g., redirect to sign-in or return a 401 for API routes).
  if (!isPublicRoute(req)) {
    auth.protect();
  }
  // For public routes, or if auth.protect() doesn't redirect/throw,
  // the request proceeds as normal. NextResponse.next() is implied.
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files from Next.js)
     * - _next/image (image optimization files from Next.js)
     * - assets/ (your static asset images, fonts, etc. if you have an /assets folder in /public)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - robots.txt (SEO)
     * - sitemap.xml (SEO)
     *
     * This ensures that the middleware runs on all relevant pages and API routes
     * that should be processed by Clerk.
     */
    '/((?!_next/static|_next/image|assets|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)',
    '/' // Explicitly match the root path
  ],
};
