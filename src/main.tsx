
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from 'next-themes'; // Import ThemeProvider
import { ClerkProvider } from '@clerk/clerk-react'; // Import ClerkProvider

// Get the publishable key from environment variables
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Check if the key is available
if (!CLERK_PUBLISHABLE_KEY) {
  console.error("Missing Clerk Publishable Key. Add VITE_CLERK_PUBLISHABLE_KEY to your .env file.");
}

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder'}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <App />
        </ThemeProvider>
      </ClerkProvider>
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element. App can't be mounted.");
}
