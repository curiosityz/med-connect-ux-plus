
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
  // Define routes that should be publicly accessible.
  // Clerk will automatically make sub-paths of these public as well (e.g., /sign-in/xyz).
  publicRoutes: [
    '/sign-in',
    '/sign-up',
    // If you have other public pages (e.g., a landing page at '/'), add them here.
    // If your root '/' should also be public, add '/' to this array.
    // Otherwise, by default, '/' will be protected.
  ],
});

export const config = {
  // This matcher ensures the middleware runs on all relevant paths,
  // excluding static files (_next/static, _next/image, favicon.ico)
  // and API routes if they are handled differently or don't need Clerk auth.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
