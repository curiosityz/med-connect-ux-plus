import { authMiddleware } from "@clerk/nextjs";

// Define routes that should be publicly accessible.
// Clerk will automatically make sub-paths of these public as well (e.g., /sign-in/xyz).
const publicRoutes = [
  '/', // Landing page
  '/pricing', // Pricing page
  '/terms', // Terms page
  '/privacy', // Privacy page
  '/sign-in(.*)', // Sign-in and its sub-routes
  '/sign-up(.*)', // Sign-up and its sub-routes
  // If you have other public pages add them here.
];

export default authMiddleware({
  publicRoutes: publicRoutes
});

export const config = {
  // This matcher ensures the middleware runs on all relevant paths,
  // excluding static files (_next/static, _next/image, favicon.ico)
  // and API routes if they are handled differently or don't need Clerk auth.
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
