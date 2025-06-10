import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BriefcaseMedical, LogIn, UserPlus, SearchCode, DollarSign } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import Image from 'next/image';


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RX Prescribers',
  description: 'Effortlessly find medical prescribers by medication, zipcode, and radius.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
          <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-16 items-center">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                  <Image
                    src="/graphics/Better-Logo.png"
                    alt="RX Prescribers Logo"
                    width={32}
                    height={32}
                    className="h-8 w-8"
                  />
                  <span className="font-bold text-xl sm:inline-block">
                    RX Prescribers
                  </span>
                </Link>
                <nav className="flex-1 items-center space-x-4 hidden md:flex">
                  <SignedIn>
                    <Link href="/finder" passHref>
                      <Button variant="ghost" className="text-foreground/80 hover:text-foreground">
                        <SearchCode className="mr-2 h-4 w-4" />
                        Finder App
                      </Button>
                    </Link>
                  </SignedIn>
                  <Link href="/pricing" passHref>
                    <Button variant="ghost" className="text-foreground/80 hover:text-foreground">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Pricing
                    </Button>
                  </Link>
                </nav>
                <div className="flex items-center justify-end space-x-2 md:space-x-4 ml-auto">
                  <SignedIn>
                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button variant="ghost">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </Button>
                    </SignInButton>
                    <Link href="/sign-up" passHref>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Sign Up
                      </Button>
                    </Link>
                  </SignedOut>
                </div>
              </div>
            </header>
            <main className="flex-1">
              {children}
            </main>
            <Toaster position="top-center" />
            <footer className="py-8 border-t bg-secondary/50">
              <div className="container text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} RX Prescribers. All rights reserved.
                <div className="mt-2 space-x-4">
                  <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
                  <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
                </div>
              </div>
            </footer>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
