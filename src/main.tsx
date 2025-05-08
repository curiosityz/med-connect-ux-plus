import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from 'next-themes'; // Import ThemeProvider

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element. App can't be mounted.");
}
