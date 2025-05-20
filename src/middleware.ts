
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
  // Define routes that should be publicly accessible.
  // Clerk will automatically make sub-paths of these public as well (e.g., /sign-in/xyz).
  publicRoutes: [
    '/', // Landing page
    '/sign-in',
    '/sign-up',
    // If you have other public pages add them here.
  ],
});

export const config = {
  // This matcher ensures the middleware runs on all relevant paths,
  // excluding static files (_next/static, _next/image, favicon.ico)
  // and API routes if they are handled differently or don't need Clerk auth.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};

